'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  HeartPulse, 
  Building2, 
  BrainCircuit,
  Calculator,
  CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const navItems = [
    { id: 'overview', href: '/', label: 'Overview', icon: LayoutDashboard },
    { id: 'financial', href: '/financial', label: 'Financial', icon: TrendingUp },
    { id: 'operational', href: '/operational', label: 'Operational', icon: Activity },
    { id: 'clinical', href: '/clinical', label: 'Clinical & Quality', icon: HeartPulse },
    { id: 'department', href: '/department', label: 'Departments', icon: Building2 },
    { id: 'predictive', href: '/predictive', label: 'Predictive', icon: BrainCircuit },
    { id: 'formulas', href: '/formulas', label: 'Formulas', icon: Calculator },
  ];

  return (
    <header className="bg-zinc-950/80 backdrop-blur-md text-zinc-100 sticky top-0 z-40 border-b border-zinc-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Header */}
          <Link href={`/${queryString}`} className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg shadow-inner group-hover:bg-emerald-500/30 transition-all">
              Ā
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                Aarogya Analytics
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium mt-1">Healthcare Institutional Dashboard</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const targetHref = `${item.href}${queryString}`;

              return (
                <Link
                  key={item.id}
                  href={targetHref}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Connection Status Tick Icon in Far Right */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              className="p-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shadow-xs"
              title="Live Database Sync Active"
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* Mobile / Tablet Nav Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-3 pt-1 border-t border-zinc-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const targetHref = `${item.href}${queryString}`;

            return (
              <Link
                key={item.id}
                href={targetHref}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
