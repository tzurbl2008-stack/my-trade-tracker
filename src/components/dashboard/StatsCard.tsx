import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const colorMap = {
  blue: {
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    icon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
  },
  red: {
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-600 dark:text-yellow-400',
  },
  purple: {
    icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className={`text-sm mt-1 ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
            }`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
