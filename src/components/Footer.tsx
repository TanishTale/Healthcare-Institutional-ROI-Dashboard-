'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Calculator, FileText, Database } from 'lucide-react';

export default function Footer() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-extrabold">
                Ā
              </div>
              <span>Aarogya Analytics</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Institutional Healthcare RoI & Clinical Efficiency Intelligence System. High-contrast SaaS analytical governance.
            </p>
          </div>

          {/* Column 2: Navigation Shortcuts */}
          <div>
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">
              Analytics Modules
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href={`/${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link href={`/financial${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Financial Performance
                </Link>
              </li>
              <li>
                <Link href={`/operational${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Operational Throughput
                </Link>
              </li>
              <li>
                <Link href={`/clinical${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Clinical & Quality Indicators
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Advanced Analytics */}
          <div>
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">
              Decision Support
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href={`/department${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Department Composite Scores
                </Link>
              </li>
              <li>
                <Link href={`/predictive${queryString}`} className="hover:text-emerald-400 transition-colors">
                  Predictive & Early Warnings
                </Link>
              </li>
              <li>
                <Link href={`/formulas${queryString}`} className="hover:text-emerald-400 transition-colors font-bold text-emerald-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Formula Reference Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: System & Database Spec */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              System Architecture
            </h4>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL Direct</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>De-Identified HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canonical Sync</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Aarogya Analytics. Healthcare Institutional RoI Dashboard.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-zinc-400 font-mono">Dark SaaS Mode</span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 font-medium">All Systems Synchronized</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
