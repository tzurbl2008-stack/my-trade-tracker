import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import EquityChart from '../components/charts/EquityChart';
import { useActiveAccount, useActiveTrades, useAppStore } from '../store/useAppStore';
import { getWinRate, getAverageRR, getCurrentDrawdown, getAccountBalance, getRiskLevel } from '../utils/calculations';
import { riskLevelLabels } from '../components/ui/Badge';

export default function Analytics() {
  const { state } = useAppStore();
  const activeAccount = useActiveAccount();
  const trades = useActiveTrades();
  const isDark = state.darkMode;

  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 dark:text-slate-500">
        אין חשבון פעיל
      </div>
    );
  }

  const closedTrades = trades.filter((t) => t.status === 'closed');
  const openTrades = trades.filter((t) => t.status === 'open');
  const winRate = getWinRate(closedTrades);
  const avgRR = getAverageRR(closedTrades);
  const drawdown = getCurrentDrawdown(activeAccount, trades);
  const accountBalance = getAccountBalance(activeAccount, trades);
  const totalPnl = accountBalance - activeAccount.initialBalance;

  // P&L by symbol
  const pnlBySymbol = closedTrades.reduce<Record<string, number>>((acc, t) => {
    acc[t.symbol] = (acc[t.symbol] ?? 0) + (t.pnl ?? 0);
    return acc;
  }, {});
  const pnlChartData = Object.entries(pnlBySymbol)
    .map(([symbol, pnl]) => ({ symbol, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

  // Win/loss pie
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0).length;
  const breakeven = closedTrades.length - wins - losses;
  const pieData = [
    { name: 'רווח', value: wins, color: '#22c55e' },
    { name: 'הפסד', value: losses, color: '#ef4444' },
    ...(breakeven > 0 ? [{ name: 'איזון', value: breakeven, color: '#94a3b8' }] : []),
  ].filter((d) => d.value > 0);

  // Risk distribution
  const riskDist = closedTrades.reduce<Record<string, number>>((acc, t) => {
    if (t.riskPercent != null) {
      const level = riskLevelLabels[getRiskLevel(t.riskPercent)];
      acc[level] = (acc[level] ?? 0) + 1;
    }
    return acc;
  }, {});
  const riskDistData = Object.entries(riskDist).map(([name, value]) => ({ name, value }));

  const axisStyle = { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 };
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ניתוח ביצועים</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeAccount.name}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ P&L', value: `${totalPnl >= 0 ? '+' : ''}${activeAccount.currency}${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? 'text-green-500' : 'text-red-500' },
          { label: 'אחוז ניצחון', value: `${winRate.toFixed(0)}%`, color: winRate >= 50 ? 'text-green-500' : 'text-yellow-500' },
          { label: 'ממוצע R/R', value: avgRR > 0 ? `1:${avgRR.toFixed(1)}` : '—', color: 'text-blue-500' },
          { label: 'Drawdown', value: `${drawdown.toFixed(1)}%`, color: drawdown > 10 ? 'text-red-500' : 'text-green-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <EquityChart />

      {/* P&L by symbol */}
      {pnlChartData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">רווח/הפסד לפי נייר ערך</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="symbol" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${activeAccount.currency}${v}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '0.75rem',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  direction: 'rtl',
                }}
                formatter={(value: number) => [`${activeAccount.currency}${value.toFixed(2)}`, 'P&L']}
              />
              <Bar
                dataKey="pnl"
                radius={[4, 4, 0, 0]}
              >
                {pnlChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Win/Loss pie + Risk distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Win/Loss pie */}
        {pieData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">התפלגות עסקאות</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '0.75rem',
                    direction: 'rtl',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk distribution */}
        {riskDistData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">התפלגות רמות סיכון</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskDistData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '0.75rem',
                    direction: 'rtl',
                  }}
                  formatter={(value: number) => [value, 'עסקאות']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Open trades summary */}
      {openTrades.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">עסקאות פתוחות</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">סמל</th>
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">כיוון</th>
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">כניסה</th>
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">סטופ</th>
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">יעד</th>
                  <th className="text-right pb-2 font-medium text-slate-500 dark:text-slate-400">סיכון</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-semibold">{t.symbol}</td>
                    <td className={`py-2 ${t.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.direction === 'long' ? 'Long ↑' : 'Short ↓'}
                    </td>
                    <td className="py-2">{t.entryPrice}</td>
                    <td className="py-2 text-red-400">{t.stopPrice}</td>
                    <td className="py-2 text-green-400">{t.limitPrice ?? '—'}</td>
                    <td className="py-2">{(t.riskPercent ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
