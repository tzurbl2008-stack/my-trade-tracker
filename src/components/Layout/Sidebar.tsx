import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, List, Settings, TrendingUp } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { path: '/trades', label: 'עסקאות', icon: List },
  { path: '/analytics', label: 'ניתוח', icon: LineChart },
  { path: '/settings', label: 'הגדרות', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 hidden md:flex flex-col py-4 sticky top-16 h-[calc(100vh-4rem)]">
      {/* Logo area for wider screens */}
      <div className="px-4 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <TrendingUp size={18} className="text-white" />
        </div>
        <span className="font-bold text-slate-900 dark:text-slate-100">יומן מסחר</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-600 text-center">יומן מסחר v1.0</p>
      </div>
    </aside>
  );
}
