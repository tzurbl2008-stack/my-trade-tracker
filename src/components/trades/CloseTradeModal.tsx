import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge, { riskLevelLabels } from '../ui/Badge';
import { useAppStore, useActiveAccount } from '../../store/useAppStore';
import { Trade } from '../../types';
import {
  calculatePnL,
  calculateRisk,
  calculateRR,
  getRiskLevel,
  getAccountBalance,
  getPerformanceScore,
  generateTradeSuggestions,
} from '../../utils/calculations';

interface Props {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
}

export default function CloseTradeModal({ trade, isOpen, onClose }: Props) {
  const { state, dispatch } = useAppStore();
  const activeAccount = useActiveAccount();
  const [exitPrice, setExitPrice] = useState(trade.exitPrice?.toString() ?? '');
  const [error, setError] = useState('');

  const accountBalance = activeAccount ? getAccountBalance(activeAccount, state.trades) : 0;
  const exit = parseFloat(exitPrice) || 0;

  const previewPnl = exit ? calculatePnL(trade.direction, trade.entryPrice, exit, trade.shares) : 0;
  const previewPnlPct = trade.amountInvested > 0 ? (previewPnl / trade.amountInvested) * 100 : 0;
  const previewRisk = exit ? calculateRisk(trade.entryPrice, trade.stopPrice, trade.shares, accountBalance) : null;
  const previewRR = trade.limitPrice ? calculateRR(trade.entryPrice, trade.stopPrice, trade.limitPrice) : null;
  const riskLevel = previewRisk ? getRiskLevel(previewRisk.percent) : null;

  const handleClose = () => {
    if (!exitPrice || isNaN(parseFloat(exitPrice))) {
      setError('הזן מחיר יציאה תקין');
      return;
    }
    dispatch({
      type: 'CLOSE_TRADE',
      payload: {
        id: trade.id,
        exitPrice: parseFloat(exitPrice),
        closeDate: new Date().toISOString(),
      },
    });
    onClose();
  };

  // Preview suggestions
  const previewTrade: Trade = {
    ...trade,
    exitPrice: exit || undefined,
    pnl: exit ? previewPnl : undefined,
    pnlPercent: exit ? previewPnlPct : undefined,
    riskAmount: previewRisk?.amount,
    riskPercent: previewRisk?.percent,
    rrRatio: previewRR ?? undefined,
    status: 'closed',
  };
  const suggestions = exit ? generateTradeSuggestions(previewTrade, accountBalance) : [];
  const score = exit ? getPerformanceScore(previewTrade) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`סגירת עסקה – ${trade.symbol}`} size="lg">
      <div className="space-y-4">
        {/* Trade info */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">כיוון: </span>
            <span className={`font-medium ${trade.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
              {trade.direction === 'long' ? 'Long ↑' : 'Short ↓'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">כמות: </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{trade.shares}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">מחיר כניסה: </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{trade.entryPrice}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">סטופ לוס: </span>
            <span className="font-medium text-red-500">{trade.stopPrice}</span>
          </div>
          {trade.limitPrice && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">יעד: </span>
              <span className="font-medium text-green-500">{trade.limitPrice}</span>
            </div>
          )}
        </div>

        {/* Exit price */}
        <div>
          <label className="label">מחיר יציאה *</label>
          <input
            type="number"
            className={`input text-lg font-semibold ${error ? 'border-red-500' : ''}`}
            placeholder="0.00"
            step="0.01"
            value={exitPrice}
            onChange={(e) => {
              setExitPrice(e.target.value);
              setError('');
            }}
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {/* Preview P&L */}
        {exit > 0 && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border-2 ${previewPnl >= 0 ? 'border-green-500/30 bg-green-50 dark:bg-green-900/10' : 'border-red-500/30 bg-red-50 dark:bg-red-900/10'}`}>
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">רווח / הפסד</p>
                <p className={`text-3xl font-bold ${previewPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {previewPnl >= 0 ? '+' : ''}{activeAccount?.currency}{previewPnl.toFixed(2)}
                </p>
                <p className={`text-sm font-medium mt-1 ${previewPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {previewPnlPct >= 0 ? '+' : ''}{previewPnlPct.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {previewRisk && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון</p>
                    <p className="font-semibold text-sm">{activeAccount?.currency}{previewRisk.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון %</p>
                    {riskLevel && (
                      <Badge riskLevel={riskLevel} className="text-xs">
                        {riskLevelLabels[riskLevel]} ({previewRisk.percent.toFixed(1)}%)
                      </Badge>
                    )}
                  </div>
                </>
              )}
              {previewRR && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">R/R</p>
                  <p className="font-semibold text-sm">1:{previewRR.toFixed(1)}</p>
                </div>
              )}
              {score !== null && (
                <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center ${previewRisk ? 'col-span-3' : ''}`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ציון ביצוע</p>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{score}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">המלצות</p>
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">💡</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleClose}
            variant={exit > 0 && previewPnl >= 0 ? 'success' : 'danger'}
            className="flex-1"
          >
            {exit > 0 && previewPnl >= 0 ? 'סגור ברווח' : 'סגור עסקה'}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            ביטול
          </Button>
        </div>
      </div>
    </Modal>
  );
}
