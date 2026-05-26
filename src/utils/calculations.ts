import { Trade, Account, RiskLevel } from '../types';

export function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  shares: number
): number {
  if (direction === 'long') {
    return (exitPrice - entryPrice) * shares;
  } else {
    return (entryPrice - exitPrice) * shares;
  }
}

export function calculateRisk(
  entryPrice: number,
  stopPrice: number,
  shares: number,
  accountBalance: number
): { amount: number; percent: number } {
  const amount = Math.abs(entryPrice - stopPrice) * shares;
  const percent = accountBalance > 0 ? (amount / accountBalance) * 100 : 0;
  return { amount, percent };
}

export function calculateRR(
  entryPrice: number,
  stopPrice: number,
  limitPrice: number
): number {
  const risk = Math.abs(entryPrice - stopPrice);
  const reward = Math.abs(limitPrice - entryPrice);
  if (risk === 0) return 0;
  return reward / risk;
}

export function getRiskLevel(riskPercent: number): RiskLevel {
  if (riskPercent < 1) return 'low';
  if (riskPercent < 2) return 'medium';
  if (riskPercent < 5) return 'high';
  return 'very-high';
}

export function getAccountBalance(account: Account, trades: Trade[]): number {
  const closedTrades = trades.filter(
    (t) => t.accountId === account.id && t.status === 'closed'
  );
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  return account.initialBalance + totalPnl;
}

export function getEquityCurve(
  account: Account,
  trades: Trade[]
): Array<{ date: string; balance: number }> {
  const closedTrades = trades
    .filter((t) => t.accountId === account.id && t.status === 'closed' && t.closeDate)
    .sort((a, b) => new Date(a.closeDate!).getTime() - new Date(b.closeDate!).getTime());

  const curve: Array<{ date: string; balance: number }> = [
    { date: account.createdAt.split('T')[0], balance: account.initialBalance },
  ];

  let running = account.initialBalance;
  for (const trade of closedTrades) {
    running += trade.pnl ?? 0;
    curve.push({ date: trade.closeDate!.split('T')[0], balance: running });
  }

  return curve;
}

export function getWinRate(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status === 'closed');
  if (closed.length === 0) return 0;
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  return (wins / closed.length) * 100;
}

export function getAverageRR(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status === 'closed' && t.rrRatio != null);
  if (closed.length === 0) return 0;
  const total = closed.reduce((sum, t) => sum + (t.rrRatio ?? 0), 0);
  return total / closed.length;
}

export function getPerformanceScore(trade: Trade): number {
  let score = 50;

  // PnL contribution
  if ((trade.pnl ?? 0) > 0) {
    score += 20;
  } else {
    score -= 20;
  }

  // Risk management
  const riskPct = trade.riskPercent ?? 0;
  if (riskPct < 1) score += 15;
  else if (riskPct < 2) score += 5;
  else if (riskPct > 5) score -= 15;

  // R/R contribution
  const rr = trade.rrRatio ?? 0;
  if (rr >= 2) score += 15;
  else if (rr >= 1) score += 5;
  else if (rr > 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function generateTradeSuggestions(trade: Trade, accountBalance: number): string[] {
  const suggestions: string[] = [];
  const riskPct = trade.riskPercent ?? 0;
  const rr = trade.rrRatio ?? 0;
  const pnl = trade.pnl ?? 0;

  if (riskPct > 5) {
    suggestions.push('סיכון גבוה מאוד! מומלץ להגביל סיכון ל-2% מהחשבון לכל היותר.');
  } else if (riskPct > 2) {
    suggestions.push('הסיכון בעסקה זו גבוה. שקול להקטין את גודל הפוזיציה לעסקאות הבאות.');
  } else if (riskPct < 0.5) {
    suggestions.push('הסיכון נמוך מאוד – יתכן שניתן להגדיל מעט את הפוזיציה אם ההתנהגות המחירית תומכת.');
  }

  if (rr > 0 && rr < 1) {
    suggestions.push('יחס סיכוי/סיכון נמוך מ-1. מומלץ לחפש עסקאות עם יחס של לפחות 1:2.');
  } else if (rr >= 2) {
    suggestions.push('יחס סיכוי/סיכון מצוין! המשך לחפש הגדרות עסקה דומות.');
  }

  if (pnl < 0 && trade.limitPrice) {
    suggestions.push('העסקה נסגרה בהפסד לפני הגעה ליעד. בדוק את מיקום הסטופ לוס.');
  }

  if (pnl > 0 && rr > 0 && pnl < (trade.riskAmount ?? 0) * rr * 0.5) {
    suggestions.push('יצאת מוקדם מדי. שקול לאפשר לרווחים לרוץ עד ליעד המחיר.');
  }

  if (suggestions.length === 0) {
    if (pnl > 0) {
      suggestions.push('עסקה מצוינת! שמור על אותה רמת משמעת ועקביות.');
    } else {
      suggestions.push('הפסד הוא חלק מהמסחר. הדבר החשוב הוא לשמור על ניהול סיכונים נכון.');
    }
  }

  // Extra general suggestions
  if (accountBalance > 0 && Math.abs(trade.amountInvested) / accountBalance > 0.3) {
    suggestions.push('הפוזיציה גדולה ביחס לחשבון. שקול לפזר את ההשקעה.');
  }

  return suggestions;
}

export function generateGeneralTips(trades: Trade[], _accounts: Account[]): string[] {
  const tips: string[] = [];
  const closed = trades.filter((t) => t.status === 'closed');

  const winRate = getWinRate(closed);
  const avgRisk = closed.length > 0
    ? closed.reduce((s, t) => s + (t.riskPercent ?? 0), 0) / closed.length
    : 0;
  const avgRR = getAverageRR(closed);

  if (winRate < 50 && closed.length >= 5) {
    tips.push('אחוז ניצחון נמוך מ-50%. עבוד על שיפור נקודות הכניסה והמתן לאישורים טכניים חזקים יותר.');
  }

  if (avgRisk > 2 && closed.length >= 3) {
    tips.push('הסיכון הממוצע גבוה מ-2%. הקטן את גודל הפוזיציות כדי לשמור על ניהול הון בריא.');
  }

  if (avgRR < 1 && closed.length >= 5) {
    tips.push('יחס R/R ממוצע נמוך. שפר את קביעת יעדי הרווח – שאף ליחס של לפחות 1:2.');
  }

  // General tips always shown
  tips.push('ניהול סיכונים הוא המפתח להצלחה לטווח ארוך. לעולם אל תסכן יותר מ-2% מהחשבון בעסקה בודדת.');
  tips.push('שמור על יומן מסחר מפורט. ניתוח עסקאות עבר הוא הדרך הטובה ביותר להשתפר.');
  tips.push('אל תנסה לנקום על הפסד. כל עסקה חדשה היא הזדמנות נפרדת לחלוטין.');

  if (closed.length < 3) {
    tips.push('עדיין אין מספיק עסקאות לניתוח מעמיק. המשך לתעד ולסגור עסקאות לקבלת תובנות מותאמות אישית.');
  }

  return tips;
}

export function getCurrentDrawdown(account: Account, trades: Trade[]): number {
  const curve = getEquityCurve(account, trades);
  if (curve.length < 2) return 0;

  let peak = curve[0].balance;
  let maxDrawdown = 0;

  for (const point of curve) {
    if (point.balance > peak) peak = point.balance;
    const drawdown = peak > 0 ? ((peak - point.balance) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return maxDrawdown;
}
