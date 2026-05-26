import React, { useState } from 'react';
import { Sun, Moon, ChevronDown, Plus, Settings, TrendingUp } from 'lucide-react';
import { useAppStore, useActiveAccount } from '../../store/useAppStore';
import { getAccountBalance } from '../../utils/calculations';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function Header() {
  const { state, dispatch } = useAppStore();
  const activeAccount = useActiveAccount();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', initialBalance: '', currency: '₪' });

  const accountBalance = activeAccount
    ? getAccountBalance(activeAccount, state.trades)
    : 0;

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.initialBalance) return;
    const account = {
      id: `acc-${Date.now()}`,
      name: newAccount.name,
      initialBalance: parseFloat(newAccount.initialBalance),
      currency: newAccount.currency,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ACCOUNT', payload: account });
    setNewAccount({ name: '', initialBalance: '', currency: '₪' });
    setShowAddAccount(false);
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-lg hidden sm:block">יומן מסחר</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Account selector */}
          {state.accounts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
              >
                <div className="text-right">
                  <div className="font-medium text-slate-900 dark:text-slate-100 leading-none">
                    {activeAccount?.name ?? 'בחר חשבון'}
                  </div>
                  {activeAccount && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeAccount.currency}{accountBalance.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {showAccountMenu && (
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1">
                  {state.accounts.map((acc) => {
                    const bal = getAccountBalance(acc, state.trades);
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: acc.id });
                          setShowAccountMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-right ${
                          acc.id === state.activeAccountId
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{acc.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {acc.currency}{bal.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        {acc.id === state.activeAccountId && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowAddAccount(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-blue-500 text-sm"
                    >
                      <Plus size={14} />
                      הוסף חשבון חדש
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            title={state.darkMode ? 'מצב יום' : 'מצב לילה'}
          >
            {state.darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings link */}
          <a
            href="/settings"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          >
            <Settings size={18} />
          </a>
        </div>

        {/* Click outside to close menu */}
        {showAccountMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
        )}
      </header>

      {/* Add Account Modal */}
      <Modal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} title="הוסף חשבון חדש">
        <div className="space-y-4">
          <div>
            <label className="label">שם החשבון</label>
            <input
              type="text"
              className="input"
              placeholder="לדוגמה: חשבון ראשי"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">יתרת פתיחה</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={newAccount.initialBalance}
              onChange={(e) => setNewAccount({ ...newAccount, initialBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="label">מטבע</label>
            <select
              className="input"
              value={newAccount.currency}
              onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
            >
              <option value="₪">₪ שקל</option>
              <option value="$">$ דולר</option>
              <option value="€">€ יורו</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAddAccount} className="flex-1">
              צור חשבון
            </Button>
            <Button variant="secondary" onClick={() => setShowAddAccount(false)} className="flex-1">
              ביטול
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
