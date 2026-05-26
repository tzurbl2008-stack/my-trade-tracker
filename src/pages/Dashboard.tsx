import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
  Activity,
  Plus,
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import TradingTips from '../components/dashboard/TradingTips';
import EquityChart from '../components/charts/EquityChart';
import TradeRow from '../components/trades/TradeRow';
import AddTradeModal from '../components/trades/AddTradeModal';
import Button from '../components/ui/Button';
import { useActiveAccount, useActiveTrades } from '../store/useAppStore';
import {
  getAccountBalance,
  getWinRate,
  getAverageRR,
  getCurrentDrawdown,
} from '../utils/calculations';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { state } = useAppStore();
  const activeAccount = useActiveAccount();
  const trades = useActiveTrades();
  const [showAdd, setShowAdd] = useState(false);

  if (!activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
          <Wallet size={32} className="text-blue-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">אין חשבון פעיל</h2>
          <p className="text-slate-500 dark:text-slate-400">צור חשבון חדש מהכותרת כדי להתחיל</p>
        </div>
      </div>
    );
  }

  const accountBalance = getAccountBalance(activeAccount, trades);
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const openTrades = trades.filter((t) => t.status === 'open');
  const totalPnl = accountBalance - activeAccount.initialBalance;
  const totalPnlPct = activeAccount.initialBalance > 0 ? (totalPnl / activeAccount.initialBalance) * 100 : 0;
  const winRate = getWinRate(closedTrades);
  const avgRR = getAverageRR(closedTrades);
  const drawdown = getCurrentDrawdown(activeAccount, trades);

  const bestTrade = closedTrades.reduce<typeof closedTrades[0] | null>((best, t) =>
    !best || (t.pnl ?? 0) > (best.pnl ?? 0) ? t : best, null);
  const worstTrade = closedTrades.reduce<typeof closedTrades[0] | null>((worst, t) =>
    !worst || (t.pnl ?? 0) < (worst.pnl ?? 0) ? t : worst, null);

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">לוח בקרה</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{activeAccount.name}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="md">
          <Plus size={16} />
          עסקה חדשה
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="יתרה נוכחית"
          value={`${activeAccount.currency}${accountBalance.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`}
          subtitle={`${totalPnl >= 0 ? '+' : ''}${activeAccount.currency}${totalPnl.toLocaleString('he-IL', { maximumFractionDigits: 0 })} (${totalPnlPct.toFixed(1)}%)`}
          trend={totalPnl >= 0 ? 'up' : 'down'}
          icon={Wallet}
          color="blue"
        />
        <StatsCard
          title="אחוז ניצחון"
          value={`${winRate.toFixed(0)}%`}
          subtitle={`${closedTrades.filter(t => (t.pnl ?? 0) > 0).length}/${closedTrades.length} עסקאות`}
          icon={Target}
          color={winRate >= 50 ? 'green' : 'yellow'}
        />
        <StatsCard
          title="ממוצע R/R"
          value={avgRR > 0 ? `1:${avgRR.toFixed(1)}` : '—'}
          subtitle={closedTrades.length > 0 ? `${closedTrades.length} עסקאות סגורות` : 'אין עסקאות'}
          icon={BarChart2}
          color="purple"
        />
        <StatsCard
          title="Drawdown מקסימלי"
          value={`${drawdown.toFixed(1)}%`}
          subtitle={`${openTrades.length} פתוחות`}
          trend={drawdown > 10 ? 'down' : 'neutral'}
          icon={Activity}
          color={drawdown > 10 ? 'red' : drawdown > 5 ? 'yellow' : 'green'}
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="סה״כ עסקאות"
          value={trades.length}
          subtitle={`${openTrades.length} פתוחות, ${closedTrades.length} סגורות`}
          icon={BarChart2}
          color="blue"
        />
        <StatsCard
          title="סה״כ רווח/הפסד"
          value={`${totalPnl >= 0 ? '+' : ''}${activeAccount.currency}${Math.abs(totalPnl).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`}
          trend={totalPnl >= 0 ? 'up' : 'down'}
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          color={totalPnl >= 0 ? 'green' : 'red'}
        />
        {bestTrade && (
          <StatsCard
            title="עסקה טובה ביותר"
            value={`${activeAccount.currency}${(bestTrade.pnl ?? 0).toFixed(0)}`}
            subtitle={bestTrade.symbol}
            trend="up"
            icon={TrendingUp}
            color="green"
          />
        )}
        {worstTrade && (
          <StatsCard
            title="עסקה גרועה ביותר"
            value={`${activeAccount.currency}${(worstTrade.pnl ?? 0).toFixed(0)}`}
            subtitle={worstTrade.symbol}
            trend="down"
            icon={TrendingDown}
            color="red"
          />
        )}
      </div>

      {/* Chart */}
      <EquityChart />

      {/* Recent trades + tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent trades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">עסקאות אחרונות</h3>
            <a href="/trades" className="text-sm text-blue-500 hover:underline">הצג הכל</a>
          </div>
          {recentTrades.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
              אין עסקאות עדיין
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <TradingTips />
      </div>

      <AddTradeModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
