import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, List, Settings } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

const mobileNavItems = [
  { path: '/dashboard', label: 'בקרה', icon: LayoutDashboard },
  { path: '/trades', label: 'עסקאות', icon: List },
  { path: '/analytics', label: 'ניתוח', icon: LineChart },
  { path: '/settings', label: 'הגדרות', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex z-30">
        {mobileNavItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
