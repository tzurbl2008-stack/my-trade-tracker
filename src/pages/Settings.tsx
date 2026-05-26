import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Moon, Sun, Download, Upload, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAppStore } from '../store/useAppStore';
import { Account } from '../types';
import { getAccountBalance } from '../utils/calculations';

interface AccountFormData {
  name: string;
  initialBalance: string;
  currency: string;
}

const INITIAL_FORM: AccountFormData = { name: '', initialBalance: '', currency: '₪' };

export default function Settings() {
  const { state, dispatch } = useAppStore();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(INITIAL_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setForm(INITIAL_FORM);
    setEditAccount(null);
    setShowAddAccount(true);
  };

  const openEdit = (acc: Account) => {
    setForm({
      name: acc.name,
      initialBalance: acc.initialBalance.toString(),
      currency: acc.currency,
    });
    setEditAccount(acc);
    setShowAddAccount(true);
  };

  const handleSave = () => {
    if (!form.name || !form.initialBalance) return;
    if (editAccount) {
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          ...editAccount,
          name: form.name,
          initialBalance: parseFloat(form.initialBalance),
          currency: form.currency,
        },
      });
    } else {
      dispatch({
        type: 'ADD_ACCOUNT',
        payload: {
          id: `acc-${Date.now()}`,
          name: form.name,
          initialBalance: parseFloat(form.initialBalance),
          currency: form.currency,
          createdAt: new Date().toISOString(),
        },
      });
    }
    setShowAddAccount(false);
    setEditAccount(null);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_ACCOUNT', payload: id });
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-journal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.accounts && data.trades) {
          localStorage.setItem('trade-tracker-state', JSON.stringify(data));
          window.location.reload();
        }
      } catch {
        alert('קובץ לא תקין');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים? פעולה זו בלתי הפיכה.')) {
      localStorage.removeItem('trade-tracker-state');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">הגדרות</h1>

      {/* Accounts management */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">חשבונות מסחר</h2>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            הוסף חשבון
          </Button>
        </div>

        <div className="space-y-3">
          {state.accounts.map((acc) => {
            const balance = getAccountBalance(acc, state.trades);
            const trades = state.trades.filter((t) => t.accountId === acc.id);
            const pnl = balance - acc.initialBalance;
            const isActive = acc.id === state.activeAccountId;

            return (
              <div
                key={acc.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  isActive
                    ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{acc.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      יתרה: {acc.currency}{balance.toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                      {' · '}
                      <span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {pnl >= 0 ? '+' : ''}{acc.currency}{pnl.toFixed(0)}
                      </span>
                      {' · '}{trades.length} עסקאות
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: acc.id })}
                    >
                      בחר
                    </Button>
                  )}
                  <button
                    onClick={() => openEdit(acc)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-500"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(acc.id)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {state.accounts.length === 0 && (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
              אין חשבונות. לחץ על "הוסף חשבון" להתחיל.
            </div>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">מראה</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">מצב כהה</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {state.darkMode ? 'מצב לילה פעיל' : 'מצב יום פעיל'}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              state.darkMode ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                state.darkMode ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Data management */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">ניהול נתונים</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">ייצוא נתונים</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">שמור את כל הנתונים כקובץ JSON</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={14} />
              ייצא
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">ייבוא נתונים</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">טען נתונים מקובץ JSON</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              <Button variant="secondary" size="sm" as="span">
                <Upload size={14} />
                ייבא
              </Button>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400 text-sm">איפוס מלא</p>
              <p className="text-xs text-red-500/70 dark:text-red-500/50">מחק את כל הנתונים. בלתי הפיך!</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleReset}>
              <RefreshCw size={14} />
              איפוס
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">סטטיסטיקות כלליות</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">סה״כ חשבונות</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{state.accounts.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">סה״כ עסקאות</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{state.trades.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">עסקאות פתוחות</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {state.trades.filter((t) => t.status === 'open').length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs">עסקאות סגורות</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {state.trades.filter((t) => t.status === 'closed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      <Modal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        title={editAccount ? 'עריכת חשבון' : 'הוסף חשבון חדש'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">שם החשבון</label>
            <input
              type="text"
              className="input"
              placeholder="לדוגמה: חשבון ראשי"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">יתרת פתיחה</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
            />
          </div>
          <div>
            <label className="label">מטבע</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="₪">₪ שקל</option>
              <option value="$">$ דולר</option>
              <option value="€">€ יורו</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editAccount ? 'שמור שינויים' : 'צור חשבון'}
            </Button>
            <Button variant="secondary" onClick={() => setShowAddAccount(false)} className="flex-1">
              ביטול
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="מחיקת חשבון"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            האם אתה בטוח שברצונך למחוק חשבון זה? כל העסקאות המשויכות אליו ימחקו.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">
              מחק
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              ביטול
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
