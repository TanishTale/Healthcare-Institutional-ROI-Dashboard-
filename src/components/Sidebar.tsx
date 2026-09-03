'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  HeartPulse, 
  Building2, 
  BrainCircuit,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
}

export default function Sidebar({ currentTab = 'overview' }: SidebarProps) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const navItems = [
    { id: 'overview', href: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'financial', href: '/financial', label: 'Financial Analytics', icon: TrendingUp },
    { id: 'operational', href: '/operational', label: 'Operational Analytics', icon: Activity },
    { id: 'clinical', href: '/clinical', label: 'Clinical & Quality', icon: HeartPulse },
    { id: 'department', href: '/department', label: 'Department Performance', icon: Building2 },
    { id: 'predictive', href: '/predictive', label: 'Predictive Analytics', icon: BrainCircuit },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          M
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            MedIQ
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono font-medium border border-blue-800">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Healthcare Institutional RoI</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Analytics Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === currentTab;
          const targetHref = `${item.href}${queryString}`;

          return (
            <Link
              key={item.id}
              href={targetHref}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <p className="text-slate-200 font-medium truncate">Supabase Direct</p>
            <p className="text-[11px] text-slate-400 truncate">PostgreSQL Connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
