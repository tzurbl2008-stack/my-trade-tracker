import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useActiveAccount, useActiveTrades, useAppStore } from '../../store/useAppStore';
import { getEquityCurve } from '../../utils/calculations';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCurrency(value: number, currency: string) {
  return `${currency}${value.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
  initialBalance: number;
}

function CustomTooltip({ active, payload, label, currency, initialBalance }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  const change = value - initialBalance;
  const changePct = initialBalance > 0 ? (change / initialBalance) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-right">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
        {formatCurrency(value, currency)}
      </p>
      <p className={`text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? '+' : ''}{formatCurrency(change, currency)} ({changePct.toFixed(1)}%)
      </p>
    </div>
  );
}

export default function EquityChart() {
  const { state } = useAppStore();
  const activeAccount = useActiveAccount();
  const trades = useActiveTrades();

  if (!activeAccount) {
    return (
      <div className="card p-5 flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        אין חשבון פעיל
      </div>
    );
  }

  const curve = getEquityCurve(activeAccount, trades);
  const isDark = state.darkMode;

  const chartColor = (() => {
    if (curve.length < 2) return '#3b82f6';
    const last = curve[curve.length - 1].balance;
    return last >= activeAccount.initialBalance ? '#22c55e' : '#ef4444';
  })();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">עקומת הון</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {curve.length - 1} עסקאות סגורות
        </div>
      </div>

      {curve.length < 2 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
          אין מספיק נתונים להצגת הגרף
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={curve} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#334155' : '#e2e8f0'}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${activeAccount.currency}${(v / 1000).toFixed(0)}k`}
              width={55}
            />
            <Tooltip
              content={
                <CustomTooltip
                  currency={activeAccount.currency}
                  initialBalance={activeAccount.initialBalance}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={chartColor}
              strokeWidth={2.5}
              fill="url(#equityGradient)"
              dot={{ fill: chartColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
