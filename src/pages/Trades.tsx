import React, { useState, useMemo } from 'react';
import { Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
import Button from '../components/ui/Button';
import TradeRow from '../components/trades/TradeRow';
import AddTradeModal from '../components/trades/AddTradeModal';
import { useActiveTrades, useActiveAccount } from '../store/useAppStore';
import { Trade } from '../types';

type SortField = 'date' | 'pnl' | 'symbol';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'open' | 'closed';
type DirectionFilter = 'all' | 'long' | 'short';

export default function Trades() {
  const trades = useActiveTrades();
  const activeAccount = useActiveAccount();
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [symbolSearch, setSymbolSearch] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result: Trade[] = [...trades];

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (directionFilter !== 'all') {
      result = result.filter((t) => t.direction === directionFilter);
    }
    if (symbolSearch) {
      result = result.filter((t) =>
        t.symbol.toLowerCase().includes(symbolSearch.toLowerCase())
      );
    }
    if (dateFrom) {
      result = result.filter((t) => t.openDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.openDate <= dateTo + 'T23:59:59');
    }

    result.sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        diff = new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
      } else if (sortField === 'pnl') {
        diff = (a.pnl ?? 0) - (b.pnl ?? 0);
      } else if (sortField === 'symbol') {
        diff = a.symbol.localeCompare(b.symbol);
      }
      return sortDir === 'asc' ? diff : -diff;
    });

    return result;
  }, [trades, statusFilter, directionFilter, symbolSearch, dateFrom, dateTo, sortField, sortDir]);

  const openCount = trades.filter((t) => t.status === 'open').length;
  const closedCount = trades.filter((t) => t.status === 'closed').length;

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        sortField === field
          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
      }`}
    >
      {label}
      {sortField === field
        ? sortDir === 'asc'
          ? <SortAsc size={12} />
          : <SortDesc size={12} />
        : <SortAsc size={12} className="opacity-30" />}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">עסקאות</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {openCount} פתוחות · {closedCount} סגורות
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
            סינון
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            עסקה חדשה
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Symbol search */}
            <div>
              <label className="label text-xs">חיפוש סמל</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="AAPL, TSLA..."
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
              />
            </div>
            {/* Status filter */}
            <div>
              <label className="label text-xs">סטטוס</label>
              <select
                className="input text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">הכל</option>
                <option value="open">פתוחות</option>
                <option value="closed">סגורות</option>
              </select>
            </div>
            {/* Direction filter */}
            <div>
              <label className="label text-xs">כיוון</label>
              <select
                className="input text-sm"
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)}
              >
                <option value="all">הכל</option>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            {/* Date from */}
            <div>
              <label className="label text-xs">מתאריך</label>
              <input
                type="date"
                className="input text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setDirectionFilter('all');
                setDateFrom('');
                setDateTo('');
                setSymbolSearch('');
              }}
            >
              נקה סינון
            </Button>
          </div>
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">מיון:</span>
        <SortButton field="date" label="תאריך" />
        <SortButton field="pnl" label="רווח/הפסד" />
        <SortButton field="symbol" label="סמל" />
        <span className="text-xs text-slate-400 dark:text-slate-500 mr-auto">
          {filtered.length} תוצאות
        </span>
      </div>

      {/* Trades list */}
      {!activeAccount ? (
        <div className="card p-8 text-center text-slate-400 dark:text-slate-500">
          אין חשבון פעיל
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-3">
            {trades.length === 0 ? 'אין עסקאות עדיין' : 'לא נמצאו תוצאות לסינון הנוכחי'}
          </p>
          {trades.length === 0 && (
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus size={14} />
              פתח עסקה ראשונה
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      )}

      <AddTradeModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
