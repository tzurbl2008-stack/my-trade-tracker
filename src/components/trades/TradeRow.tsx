import React, { useState } from 'react';
import { Trash2, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Badge, { riskLevelLabels } from '../ui/Badge';
import { Trade } from '../../types';
import { useAppStore, useActiveAccount } from '../../store/useAppStore';
import { getRiskLevel, getPerformanceScore, generateTradeSuggestions, getAccountBalance } from '../../utils/calculations';
import CloseTradeModal from './CloseTradeModal';

interface Props {
  trade: Trade;
}

export default function TradeRow({ trade }: Props) {
  const { state, dispatch } = useAppStore();
  const activeAccount = useActiveAccount();
  const [showClose, setShowClose] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const accountBalance = activeAccount ? getAccountBalance(activeAccount, state.trades) : 0;
  const riskLevel = trade.riskPercent != null ? getRiskLevel(trade.riskPercent) : null;
  const score = trade.status === 'closed' ? getPerformanceScore(trade) : null;
  const suggestions = trade.status === 'closed' ? generateTradeSuggestions(trade, accountBalance) : [];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <>
      <div className={`card p-4 hover:shadow-md transition-all ${expanded ? 'ring-2 ring-blue-500/30' : ''}`}>
        {/* Main row */}
        <div className="flex items-center gap-3">
          {/* Symbol & direction */}
          <div className="flex-shrink-0 w-16 text-center">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{trade.symbol}</p>
            <span className={`text-xs font-medium ${trade.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
              {trade.direction === 'long' ? '↑ Long' : '↓ Short'}
            </span>
          </div>

          {/* Prices */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
            <div>
              <p className="text-slate-500 dark:text-slate-400">כניסה</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{trade.entryPrice}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">יציאה</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {trade.exitPrice ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">כמות</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{trade.shares}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">תאריך</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(trade.status === 'closed' && trade.closeDate ? trade.closeDate : trade.openDate)}
              </p>
            </div>
          </div>

          {/* P&L */}
          <div className="flex-shrink-0 w-20 text-center">
            {trade.status === 'closed' && trade.pnl != null ? (
              <>
                <p className={`font-bold text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.pnl >= 0 ? '+' : ''}{activeAccount?.currency}{trade.pnl.toFixed(0)}
                </p>
                <p className={`text-xs ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(trade.pnlPercent ?? 0) >= 0 ? '+' : ''}{(trade.pnlPercent ?? 0).toFixed(1)}%
                </p>
              </>
            ) : (
              <span className="text-xs text-blue-500 font-medium bg-blue-100 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">פתוחה</span>
            )}
          </div>

          {/* Risk badge */}
          <div className="flex-shrink-0 hidden sm:block">
            {riskLevel && (
              <Badge riskLevel={riskLevel}>{riskLevelLabels[riskLevel]}</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {trade.status === 'closed' && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {trade.status === 'open' && (
              <button
                onClick={() => setShowClose(true)}
                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors text-green-500"
                title="סגור עסקה"
              >
                <CheckCircle size={16} />
              </button>
            )}
            <button
              onClick={() => dispatch({ type: 'DELETE_TRADE', payload: trade.id })}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
              title="מחק עסקה"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && trade.status === 'closed' && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון</p>
                <p className="font-semibold">{activeAccount?.currency}{(trade.riskAmount ?? 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון %</p>
                <p className="font-semibold">{(trade.riskPercent ?? 0).toFixed(2)}%</p>
              </div>
              {trade.rrRatio != null && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">R/R</p>
                  <p className="font-semibold">1:{trade.rrRatio.toFixed(1)}</p>
                </div>
              )}
              {score !== null && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ציון</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{score}</span>
                  </div>
                </div>
              )}
            </div>

            {trade.notes && (
              <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <span className="font-medium text-slate-700 dark:text-slate-300">הערות: </span>
                {trade.notes}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">המלצות:</p>
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <span className="flex-shrink-0">💡</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showClose && (
        <CloseTradeModal trade={trade} isOpen={showClose} onClose={() => setShowClose(false)} />
      )}
    </>
  );
}
