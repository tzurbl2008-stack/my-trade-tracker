export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  stopPrice: number;
  limitPrice?: number;
  shares: number;
  amountInvested: number;
  status: TradeStatus;
  openDate: string;
  closeDate?: string;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  riskAmount?: number;
  riskPercent?: number;
  rrRatio?: number;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  currency: string;
  createdAt: string;
}

export interface AppState {
  accounts: Account[];
  activeAccountId: string | null;
  trades: Trade[];
  darkMode: boolean;
}

export type AppAction =
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: string }
  | { type: 'ADD_TRADE'; payload: Trade }
  | { type: 'CLOSE_TRADE'; payload: { id: string; exitPrice: number; closeDate: string } }
  | { type: 'DELETE_TRADE'; payload: string }
  | { type: 'TOGGLE_DARK_MODE' };
