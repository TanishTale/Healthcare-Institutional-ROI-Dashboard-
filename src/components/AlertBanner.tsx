'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, X, ExternalLink } from 'lucide-react';

export interface EfficiencyWarningItem {
  warning_id: string;
  dept_id: string;
  department_name: string;
  evaluation_date: string;
  underperforming_flag: number;
  early_warning_score: number;
  inefficiency_driver: string;
}

interface AlertBannerProps {
  warnings: EfficiencyWarningItem[];
}

export default function AlertBanner({ warnings }: AlertBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Filter only active underperforming warnings
  const activeWarnings = warnings.filter((w) => w.underperforming_flag === 1);

  if (activeWarnings.length === 0) return null;

  // Find department with highest early warning score
  const highestRisk = [...activeWarnings].sort(
    (a, b) => b.early_warning_score - a.early_warning_score
  )[0];

  return (
    <>
      {/* Dark Mode Banner Alert */}
      <div className="bg-amber-950/40 border border-amber-800/80 text-amber-200 rounded-[12px] p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-900/60 border border-amber-700/60 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                Institutional Efficiency Warning
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700/80">
                Score: {highestRisk.early_warning_score.toFixed(1)} / 100
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1 font-medium">
              <strong className="text-white underline">{highestRisk.department_name}</strong> is flagged for operational inefficiency. Driver: <span className="italic font-semibold text-amber-300">"{highestRisk.inefficiency_driver}"</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-900/50 rounded-lg transition-colors cursor-pointer"
          >
            Quick View ({activeWarnings.length})
          </button>
          <Link
            href="/predictive"
            className="px-3.5 py-1.5 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>View all alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-[12px] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Active Efficiency Warnings ({activeWarnings.length})</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
              {activeWarnings.map((w) => (
                <div
                  key={w.warning_id}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white text-sm">{w.department_name}</p>
                    <p className="text-zinc-400 mt-0.5">Driver: <span className="italic font-medium text-amber-300">"{w.inefficiency_driver}"</span></p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 block text-sm">
                      {w.early_warning_score.toFixed(1)} / 100
                    </span>
                    <span className="text-[10px] text-zinc-500">{w.evaluation_date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <Link
                href="/predictive"
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Open Predictive Module</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
