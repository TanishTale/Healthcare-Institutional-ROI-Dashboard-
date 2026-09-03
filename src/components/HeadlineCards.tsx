'use client';

import React from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { formatINR, formatPercent } from '@/lib/utils';

interface HeadlineCardsProps {
  netProfit: number;
  pctChangeVsPrev: number | null;
  overallRoi: number;
  totalAllocatedBudget: number;
  loading?: boolean;
}

export default function HeadlineCards({
  netProfit,
  pctChangeVsPrev,
  overallRoi,
  totalAllocatedBudget,
  loading = false,
}: HeadlineCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-6 h-[180px] animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-zinc-800 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-6 h-[180px] animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-zinc-800 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const isProfitable = netProfit >= 0;
  const isRoiPositive = overallRoi >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. NET PROFIT / LOSS CARD (With Radial Glow) */}
      <div className="relative overflow-hidden bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col justify-between group hover:border-zinc-700 transition-all">
        {/* Subtle Radial Gradient Background Glow */}
        <div className={`absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isProfitable ? 'bg-emerald-500/15' : 'bg-rose-500/15'
        }`} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-zinc-500" />
              Net Profit / Loss
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isProfitable
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800/80'
              }`}
            >
              {isProfitable ? '✓ Profitable' : '⚠ Loss Incurred'}
            </span>
          </div>

          <div
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatINR(netProfit)}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">vs. Previous Equivalent Period</span>
          {pctChangeVsPrev !== null ? (
            <div
              className={`flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded ${
                pctChangeVsPrev >= 0
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
              }`}
            >
              {pctChangeVsPrev >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{formatPercent(pctChangeVsPrev, true)}</span>
            </div>
          ) : (
            <span className="text-zinc-500 italic">No prior data</span>
          )}
        </div>
      </div>

      {/* 2. OVERALL INSTITUTIONAL ROI CARD (With Radial Glow) */}
      <div className="relative overflow-hidden bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col justify-between group hover:border-zinc-700 transition-all">
        {/* Subtle Radial Gradient Background Glow */}
        <div className={`absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isRoiPositive ? 'bg-blue-500/15' : 'bg-amber-500/15'
        }`} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-zinc-500" />
              Overall Institutional ROI
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isRoiPositive
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800/80'
              }`}
            >
              {isRoiPositive ? 'Positive Return' : 'Negative ROI'}
            </span>
          </div>

          <div
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isRoiPositive ? 'text-zinc-50' : 'text-rose-400'
            }`}
          >
            {formatPercent(overallRoi, true)}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Total Allocated Budget Base</span>
          <span className="font-bold text-zinc-200 font-mono">
            {formatINR(totalAllocatedBudget)}
          </span>
        </div>
      </div>

    </div>
  );
}
