import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAppStore, useActiveAccount } from '../../store/useAppStore';
import { calculateRisk, calculateRR, getAccountBalance } from '../../utils/calculations';
import { Trade } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: string;
  stopPrice: string;
  limitPrice: string;
  shares: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  symbol: '',
  direction: 'long',
  entryPrice: '',
  stopPrice: '',
  limitPrice: '',
  shares: '',
  notes: '',
};

export default function AddTradeModal({ isOpen, onClose }: Props) {
  const { state, dispatch } = useAppStore();
  const activeAccount = useActiveAccount();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Live calculations
  const entry = parseFloat(form.entryPrice) || 0;
  const stop = parseFloat(form.stopPrice) || 0;
  const limit = parseFloat(form.limitPrice) || 0;
  const shares = parseFloat(form.shares) || 0;
  const accountBalance = activeAccount
    ? getAccountBalance(activeAccount, state.trades)
    : 0;
  const amountInvested = entry * shares;
  const risk = entry && stop && shares ? calculateRisk(entry, stop, shares, accountBalance) : null;
  const rrRatio = entry && stop && limit ? calculateRR(entry, stop, limit) : null;

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.symbol.trim()) newErrors.symbol = 'שדה חובה';
    if (!form.entryPrice || isNaN(parseFloat(form.entryPrice))) newErrors.entryPrice = 'שדה חובה';
    if (!form.stopPrice || isNaN(parseFloat(form.stopPrice))) newErrors.stopPrice = 'שדה חובה';
    if (!form.shares || isNaN(parseFloat(form.shares))) newErrors.shares = 'שדה חובה';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !activeAccount) return;

    const riskData = risk ?? { amount: 0, percent: 0 };
    const trade: Trade = {
      id: `trade-${Date.now()}`,
      accountId: activeAccount.id,
      symbol: form.symbol.toUpperCase().trim(),
      direction: form.direction,
      entryPrice: parseFloat(form.entryPrice),
      stopPrice: parseFloat(form.stopPrice),
      limitPrice: form.limitPrice ? parseFloat(form.limitPrice) : undefined,
      shares: parseFloat(form.shares),
      amountInvested,
      status: 'open',
      openDate: new Date().toISOString(),
      riskAmount: riskData.amount,
      riskPercent: riskData.percent,
      rrRatio: rrRatio ?? undefined,
      notes: form.notes.trim() || undefined,
    };

    dispatch({ type: 'ADD_TRADE', payload: trade });
    setForm(INITIAL_FORM);
    onClose();
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="פתיחת עסקה חדשה" size="lg">
      <div className="space-y-4">
        {/* Symbol + Direction */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">סמל / נייר ערך *</label>
            <input
              type="text"
              className={`input uppercase ${errors.symbol ? 'border-red-500' : ''}`}
              placeholder="AAPL"
              value={form.symbol}
              onChange={(e) => update('symbol', e.target.value)}
            />
            {errors.symbol && <p className="text-xs text-red-500 mt-1">{errors.symbol}</p>}
          </div>
          <div>
            <label className="label">כיוון</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update('direction', 'long')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.direction === 'long'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-green-400'
                }`}
              >
                Long ↑
              </button>
              <button
                type="button"
                onClick={() => update('direction', 'short')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.direction === 'short'
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-red-400'
                }`}
              >
                Short ↓
              </button>
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">מחיר כניסה *</label>
            <input
              type="number"
              className={`input ${errors.entryPrice ? 'border-red-500' : ''}`}
              placeholder="0.00"
              step="0.01"
              value={form.entryPrice}
              onChange={(e) => update('entryPrice', e.target.value)}
            />
            {errors.entryPrice && <p className="text-xs text-red-500 mt-1">{errors.entryPrice}</p>}
          </div>
          <div>
            <label className="label">סטופ לוס *</label>
            <input
              type="number"
              className={`input ${errors.stopPrice ? 'border-red-500' : ''}`}
              placeholder="0.00"
              step="0.01"
              value={form.stopPrice}
              onChange={(e) => update('stopPrice', e.target.value)}
            />
            {errors.stopPrice && <p className="text-xs text-red-500 mt-1">{errors.stopPrice}</p>}
          </div>
          <div>
            <label className="label">יעד רווח</label>
            <input
              type="number"
              className="input"
              placeholder="0.00 (אופציונלי)"
              step="0.01"
              value={form.limitPrice}
              onChange={(e) => update('limitPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Shares */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">כמות מניות *</label>
            <input
              type="number"
              className={`input ${errors.shares ? 'border-red-500' : ''}`}
              placeholder="0"
              min="0"
              value={form.shares}
              onChange={(e) => update('shares', e.target.value)}
            />
            {errors.shares && <p className="text-xs text-red-500 mt-1">{errors.shares}</p>}
          </div>
          <div>
            <label className="label">סכום שהושקע</label>
            <div className="input bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-default">
              {activeAccount?.currency}{amountInvested.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Live risk preview */}
        {risk && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון</p>
              <p className="font-semibold text-sm text-red-500">
                {activeAccount?.currency}{risk.amount.toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">סיכון %</p>
              <p className={`font-semibold text-sm ${risk.percent > 2 ? 'text-red-500' : risk.percent > 1 ? 'text-yellow-500' : 'text-green-500'}`}>
                {risk.percent.toFixed(2)}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">R/R</p>
              <p className={`font-semibold text-sm ${rrRatio && rrRatio >= 2 ? 'text-green-500' : rrRatio && rrRatio >= 1 ? 'text-yellow-500' : 'text-slate-400'}`}>
                {rrRatio ? `1:${rrRatio.toFixed(1)}` : '--'}
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">הערות</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="סיבת הכניסה לעסקה, ניתוח טכני וכו'"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} className="flex-1">
            פתח עסקה
          </Button>
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            ביטול
          </Button>
        </div>
      </div>
    </Modal>
  );
}
