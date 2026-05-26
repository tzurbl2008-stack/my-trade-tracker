import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore, useActiveAccount, useActiveTrades } from '../../store/useAppStore';
import { generateGeneralTips } from '../../utils/calculations';

export default function TradingTips() {
  const { state } = useAppStore();
  const activeAccount = useActiveAccount();
  const trades = useActiveTrades();
  const [expanded, setExpanded] = useState(true);

  if (!activeAccount) return null;

  const tips = generateGeneralTips(trades, state.accounts);

  return (
    <div className="card p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Lightbulb size={16} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">טיפים למסחר</h3>
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
            {tips.length}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <ul className="mt-4 space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-yellow-500 mt-0.5 flex-shrink-0">💡</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
