'use client';

import React from 'react';
import { IndianRupee, Wallet, Bed, AlertTriangle } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface KpiRowProps {
  totalRevenue: number;
  totalExpenditure: number;
  bedOccupancyRate: number;
  activeWarningsCount: number;
  loading?: boolean;
}

export default function KpiRow({
  totalRevenue,
  totalExpenditure,
  bedOccupancyRate,
  activeWarningsCount,
  loading = false,
}: KpiRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-5 animate-pulse">
            <div className="h-3 bg-zinc-800 rounded w-1/2 mb-3"></div>
            <div className="h-7 bg-zinc-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Revenue',
      value: formatINR(totalRevenue),
      subtitle: 'Billed patient revenue',
      icon: IndianRupee,
      iconBg: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
      valueColor: 'text-zinc-50',
    },
    {
      title: 'Total Expenditure',
      value: formatINR(totalExpenditure),
      subtitle: 'Operational & service costs',
      icon: Wallet,
      iconBg: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
      valueColor: 'text-zinc-50',
    },
    {
      title: 'Bed Occupancy Rate',
      value: `${bedOccupancyRate.toFixed(1)}%`,
      subtitle: 'Inpatient capacity utilization',
      icon: Bed,
      iconBg: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
      valueColor: 'text-zinc-50',
    },
    {
      title: 'Active Efficiency Warnings',
      value: activeWarningsCount.toString(),
      subtitle: activeWarningsCount > 0 ? 'Underperforming flags raised' : 'No active warnings',
      icon: AlertTriangle,
      iconBg: activeWarningsCount > 0 ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80' : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60',
      valueColor: activeWarningsCount > 0 ? 'text-amber-400' : 'text-zinc-50',
      badge: activeWarningsCount > 0 ? `${activeWarningsCount} Flagged` : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-2xl font-bold tracking-tight ${kpi.valueColor}`}>
                {kpi.value}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-zinc-400 font-medium">{kpi.subtitle}</p>
                {kpi.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80">
                    {kpi.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
