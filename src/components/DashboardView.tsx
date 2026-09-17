import React, { useMemo } from 'react';
import { ScannedItem } from '../types';
import { NICHE_CONFIGS } from '../nicheConfigs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  items: ScannedItem[];
}

export default function DashboardView({ items }: DashboardViewProps) {
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalEstValue = 0;
    let totalEstProfit = 0;
    const categoryCount: Record<string, number> = {};
    const categoryValue: Record<string, number> = {};
    const chartDataMap: Record<string, { date: string; cost: number; value: number; profit: number }> = {};

    const validItems = items.filter(item => item.verdict && item.status === 'success');

    validItems.forEach(item => {
      const verdict = item.verdict!;
      const cost = item.buyPrice || item.acquisitionCost || item.condition?.askingPrice || 0;
      const value = item.soldPrice || verdict.marketRange?.median || verdict.suggestedListingPrice || verdict.highValue || 0;
      const profit = verdict.netEstimate?.estimatedNetProfit || Math.max(0, value - cost);

      totalCost += cost;
      totalEstValue += value;
      totalEstProfit += profit;

      const nicheName = NICHE_CONFIGS.find(n => n.id === item.nicheId)?.name || 'General';
      categoryCount[nicheName] = (categoryCount[nicheName] || 0) + 1;
      categoryValue[nicheName] = (categoryValue[nicheName] || 0) + value;

      const dateStr = new Date(item.scannedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!chartDataMap[dateStr]) {
        chartDataMap[dateStr] = { date: dateStr, cost: 0, value: 0, profit: 0 };
      }
      chartDataMap[dateStr].cost += cost;
      chartDataMap[dateStr].value += value;
      chartDataMap[dateStr].profit += profit;
    });

    const averageROI = totalCost > 0 ? ((totalEstValue - totalCost) / totalCost) * 100 : 0;
    const chartData = Object.values(chartDataMap);

    const categoryBreakdown = Object.keys(categoryValue).map(niche => ({
      niche,
      count: categoryCount[niche] || 0,
      value: categoryValue[niche] || 0,
    })).sort((a, b) => b.value - a.value);

    return { totalCost, totalEstValue, totalEstProfit, categoryBreakdown, chartData, averageROI, totalItems: validItems.length };
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-stone-950 text-white p-6 rounded-3xl border border-stone-800 shadow-2xl">
        <h2 className="text-xl font-bold font-display flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Profit & ROI Dashboard
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-col justify-center">
            <span className="text-xs font-mono text-stone-400 uppercase">Total Value</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-400 mt-1">${stats.totalEstValue.toFixed(2)}</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-col justify-center">
            <span className="text-xs font-mono text-stone-400 uppercase">Total Cost</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-rose-400 mt-1">${stats.totalCost.toFixed(2)}</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-2xl flex flex-col justify-center shadow-inner">
            <span className="text-[10px] sm:text-xs font-mono text-emerald-400/80 uppercase tracking-tight">Est. Net Profit</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-400 mt-1">${stats.totalEstProfit.toFixed(2)}</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-col justify-center">
            <span className="text-xs font-mono text-stone-400 uppercase">Average ROI</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-amber-300 mt-1">{stats.averageROI.toFixed(1)}%</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex flex-col justify-center">
            <span className="text-xs font-mono text-stone-400 uppercase">Scouted</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-stone-100 mt-1">{stats.totalItems}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-stone-300 mb-4 font-mono uppercase tracking-wider">Value vs Cost Over Time</h3>
            <div className="h-64 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="date" stroke="#78716c" tick={{ fill: '#78716c' }} />
                  <YAxis stroke="#78716c" tick={{ fill: '#78716c' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                    itemStyle={{ color: '#e7e5e4' }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Est. Value" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Cost" fill="#fb7185" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-stone-300 mb-4 font-mono uppercase tracking-wider">Category Breakdown</h3>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((item) => (
                <div key={item.niche} className="flex justify-between items-center text-sm border-b border-stone-800 pb-2 last:border-0">
                  <span className="text-stone-400">{item.niche} ({item.count})</span>
                  <span className="font-mono text-stone-100 font-bold">${item.value.toFixed(2)}</span>
                </div>
              ))}
              {stats.categoryBreakdown.length === 0 && (
                <div className="text-stone-500 text-xs italic text-center py-4">No data yet. Scout some items!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
