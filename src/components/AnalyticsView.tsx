import React from 'react';
import { InventoryItem, StockSnapshot } from '../types.ts';
import { 
  BarChart, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  Clock, 
  Save, 
  Trash2, 
  Check, 
  FileSpreadsheet
} from 'lucide-react';

interface AnalyticsViewProps {
  items: InventoryItem[];
  categories: string[];
  snapshots: StockSnapshot[];
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (snapshot: StockSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onExportExcel: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  items,
  categories,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onExportExcel
}) => {
  const totalItems = items.length;
  const demandCount = items.filter(i => i.status === 'DEMAND').length;
  const okCount = items.filter(i => i.status === 'OK').length;
  const demandPercent = totalItems > 0 ? Math.round((demandCount / totalItems) * 100) : 0;
  const okPercent = 100 - demandPercent;

  // Category breakdown
  const categoryStats = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const catDemand = catItems.filter(i => i.status === 'DEMAND');
    const catTotalRequired = catDemand.reduce((sum, i) => sum + i.requiredQty, 0);
    const prevSum = catItems.reduce((sum, i) => sum + i.previousStock, 0);
    const currSum = catItems.reduce((sum, i) => sum + i.currentStock, 0);

    return {
      category: cat,
      total: catItems.length,
      demand: catDemand.length,
      ok: catItems.length - catDemand.length,
      requiredSum: catTotalRequired,
      currentRatio: prevSum > 0 ? Math.round((currSum / prevSum) * 100) : 100
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Excel Formula & Logic Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#1F4E78]" />
              <span>DEMAND SUMMARY & AUDIT RULES</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Exact business logic formulated from your openpyxl spreadsheet engine
            </p>
          </div>

          <button
            type="button"
            onClick={onExportExcel}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1F4E78] hover:bg-[#163857] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Download .xlsx</span>
          </button>
        </div>

        {/* 3 Metric High-level blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium">Total Items Monitored</span>
            <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums mt-1">
              {totalItems}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-mono">
              =COUNTA('Demand List'!B2:B{totalItems + 1})
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 rounded-lg border border-rose-200">
            <span className="text-xs text-rose-700 font-medium">Items Requiring Demand</span>
            <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums mt-1">
              {demandCount} <span className="text-xs font-normal text-rose-500">({demandPercent}%)</span>
            </div>
            <div className="text-[11px] text-rose-400 mt-1 font-mono">
              =COUNTIF('Demand List'!G2:G{totalItems + 1},"DEMAND")
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
            <span className="text-xs text-emerald-800 font-medium">Items Stock OK</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-1">
              {okCount} <span className="text-xs font-normal text-emerald-600">({okPercent}%)</span>
            </div>
            <div className="text-[11px] text-emerald-500 mt-1 font-mono">
              =COUNTIF('Demand List'!G2:G{totalItems + 1},"OK")
            </div>
          </div>
        </div>

        {/* Logic Rules Box */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-2">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
            <span>How the Demand Calculations Work</span>
          </h3>
          <ul className="text-xs text-neutral-600 space-y-1.5 pl-5 list-decimal">
            <li>
              <strong>Previous Stock & Current Stock:</strong> Previous Stock acts as the benchmark or target par. Current Stock is the actual shelf/pantry count.
            </li>
            <li>
              <strong>Required Quantity:</strong> Calculates automatically via <code className="font-mono bg-neutral-200/80 px-1 py-0.5 rounded text-neutral-800">=MAX(0, Previous - Current)</code> so the order quantity is never negative.
            </li>
            <li>
              <strong>Status Tag:</strong> <code className="font-mono bg-neutral-200/80 px-1 py-0.5 rounded text-neutral-800">=IF(Required &gt; 0, "DEMAND", "OK")</code>. DEMAND means stock has decreased below par and replenishment is mandatory.
            </li>
          </ul>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1F4E78]" />
            <span>Stock Health By Category</span>
          </h3>
          <span className="text-xs text-neutral-500">
            {categories.length} active departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-neutral-50 text-neutral-700 border-b border-neutral-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Department / Category</th>
                <th className="py-2.5 px-4 text-center">Total Items</th>
                <th className="py-2.5 px-4 text-center">In Demand</th>
                <th className="py-2.5 px-4 text-center">Stock OK</th>
                <th className="py-2.5 px-4 text-right">Deficit Quantity</th>
                <th className="py-2.5 px-4 text-center">Stock Level vs Benchmark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categoryStats.map(stat => (
                <tr key={stat.category} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-900">
                    {stat.category}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-700">
                    {stat.total}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    {stat.demand > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-[#F4CCCC] text-[#900]">
                        {stat.demand}
                      </span>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#D9EAD3] text-[#274E13]">
                      {stat.ok}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                    {stat.requiredSum > 0 ? `+${stat.requiredSum}` : '0'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${
                            stat.currentRatio < 50 
                              ? 'bg-rose-500' 
                              : stat.currentRatio < 80 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stat.currentRatio)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-neutral-600 w-10 text-right">
                        {stat.currentRatio}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot History */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1F4E78]" />
              <span>Inventory Snapshots & Audit Log</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Save daily or shift milestones to archive stock snapshots.
            </p>
          </div>

          <button
            type="button"
            onClick={onSaveSnapshot}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-neutral-600" />
            <span>Save Current Snapshot</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 text-xs">
            No snapshots recorded yet. Click &quot;Save Current Snapshot&quot; to bookmark today&apos;s counts.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {snapshots.map(s => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-neutral-900">{s.title}</div>
                  <div className="text-xs text-neutral-500 font-mono">
                    {s.timestamp} · {s.items.length} items ({s.totalDemandItems} needed demand)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Restore snapshot "${s.title}"? This will replace your current numbers.`)) {
                        onRestoreSnapshot(s);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSnapshot(s.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
