import React from 'react';
import { RiskLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'risk';
  riskLevel?: RiskLevel;
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  risk: '',
};

const riskLevelClasses: Record<RiskLevel, string> = {
  low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'very-high': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  'very-high': 'גבוה מאוד',
};

export default function Badge({ children, variant = 'default', riskLevel, className = '' }: BadgeProps) {
  const classes = riskLevel
    ? riskLevelClasses[riskLevel]
    : variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}
    >
      {children}
    </span>
  );
}
