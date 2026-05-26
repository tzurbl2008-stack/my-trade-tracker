import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppAction, Account, Trade } from '../types';
import { loadState, saveState } from '../utils/storage';
import { calculatePnL, calculateRisk, calculateRR } from '../utils/calculations';

// ─── Sample Data ────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNT: Account = {
  id: 'acc-1',
  name: 'חשבון ראשי',
  initialBalance: 50000,
  currency: '₪',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const SAMPLE_TRADES: Trade[] = [
  {
    id: 'trade-1',
    accountId: 'acc-1',
    symbol: 'AAPL',
    direction: 'long',
    entryPrice: 180,
    stopPrice: 175,
    limitPrice: 192,
    shares: 50,
    amountInvested: 9000,
    status: 'closed',
    openDate: '2024-01-10T09:30:00.000Z',
    closeDate: '2024-01-15T15:30:00.000Z',
    exitPrice: 189,
    pnl: 450,
    pnlPercent: 5,
    riskAmount: 250,
    riskPercent: 0.5,
    rrRatio: 2.4,
    notes: 'פריצת התנגדות עם נפח גבוה',
  },
  {
    id: 'trade-2',
    accountId: 'acc-1',
    symbol: 'TSLA',
    direction: 'short',
    entryPrice: 250,
    stopPrice: 260,
    limitPrice: 225,
    shares: 30,
    amountInvested: 7500,
    status: 'closed',
    openDate: '2024-01-20T10:00:00.000Z',
    closeDate: '2024-01-25T14:00:00.000Z',
    exitPrice: 238,
    pnl: 360,
    pnlPercent: 4.8,
    riskAmount: 300,
    riskPercent: 0.6,
    rrRatio: 2.5,
    notes: 'ירידה לאחר תוצאות רבעוניות',
  },
  {
    id: 'trade-3',
    accountId: 'acc-1',
    symbol: 'NVDA',
    direction: 'long',
    entryPrice: 600,
    stopPrice: 585,
    limitPrice: 640,
    shares: 20,
    amountInvested: 12000,
    status: 'closed',
    openDate: '2024-02-01T09:45:00.000Z',
    closeDate: '2024-02-08T11:00:00.000Z',
    exitPrice: 588,
    pnl: -240,
    pnlPercent: -2,
    riskAmount: 300,
    riskPercent: 0.59,
    rrRatio: 2.67,
    notes: 'סטופ לוס הופעל',
  },
  {
    id: 'trade-4',
    accountId: 'acc-1',
    symbol: 'META',
    direction: 'long',
    entryPrice: 490,
    stopPrice: 475,
    limitPrice: 530,
    shares: 25,
    amountInvested: 12250,
    status: 'open',
    openDate: '2024-03-01T10:00:00.000Z',
    riskAmount: 375,
    riskPercent: 0.74,
    rrRatio: 2.67,
    notes: 'תמיכה חזקה באזור 490',
  },
];

// ─── Initial State ───────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const saved = loadState();
  if (saved) return saved;

  return {
    accounts: [DEFAULT_ACCOUNT],
    activeAccountId: DEFAULT_ACCOUNT.id,
    trades: SAMPLE_TRADES,
    darkMode: true,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        activeAccountId: action.payload.id,
      };

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };

    case 'DELETE_ACCOUNT': {
      const remaining = state.accounts.filter((a) => a.id !== action.payload);
      return {
        ...state,
        accounts: remaining,
        activeAccountId: remaining.length > 0 ? remaining[0].id : null,
        trades: state.trades.filter((t) => t.accountId !== action.payload),
      };
    }

    case 'SET_ACTIVE_ACCOUNT':
      return { ...state, activeAccountId: action.payload };

    case 'ADD_TRADE':
      return { ...state, trades: [...state.trades, action.payload] };

    case 'CLOSE_TRADE': {
      const { id, exitPrice, closeDate } = action.payload;
      return {
        ...state,
        trades: state.trades.map((t) => {
          if (t.id !== id) return t;
          const account = state.accounts.find((a) => a.id === t.accountId);
          const currentBalance = account
            ? account.initialBalance +
              state.trades
                .filter((x) => x.accountId === t.accountId && x.status === 'closed')
                .reduce((s, x) => s + (x.pnl ?? 0), 0)
            : 0;

          const pnl = calculatePnL(t.direction, t.entryPrice, exitPrice, t.shares);
          const pnlPercent = t.amountInvested > 0 ? (pnl / t.amountInvested) * 100 : 0;
          const { amount: riskAmount, percent: riskPercent } = calculateRisk(
            t.entryPrice,
            t.stopPrice,
            t.shares,
            currentBalance
          );
          const rrRatio = t.limitPrice
            ? calculateRR(t.entryPrice, t.stopPrice, t.limitPrice)
            : undefined;

          return {
            ...t,
            status: 'closed',
            exitPrice,
            closeDate,
            pnl,
            pnlPercent,
            riskAmount,
            riskPercent,
            rrRatio,
          };
        }),
      };
    }

    case 'DELETE_TRADE':
      return { ...state, trades: state.trades.filter((t) => t.id !== action.payload) };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  return React.createElement(AppContext.Provider, { value: { state, dispatch } }, children);
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

export function useActiveAccount() {
  const { state } = useAppStore();
  return state.accounts.find((a) => a.id === state.activeAccountId) ?? null;
}

export function useActiveTrades() {
  const { state } = useAppStore();
  return state.trades.filter((t) => t.accountId === state.activeAccountId);
}

export function useDispatchCallback() {
  const { dispatch } = useAppStore();
  return useCallback(dispatch, [dispatch]);
}
