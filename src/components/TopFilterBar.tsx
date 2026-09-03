'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar, Filter, Building2, Loader2 } from 'lucide-react';

export interface DepartmentOption {
  dept_id: string;
  department_name: string;
}

interface TopFilterBarProps {
  departments: DepartmentOption[];
  selectedDateRange: string;
  selectedDeptId: string;
  onDateRangeChange: (range: string) => void;
  onDeptChange: (deptId: string) => void;
  loading?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function TopFilterBar({
  departments,
  selectedDateRange,
  selectedDeptId,
  onDateRangeChange,
  onDeptChange,
  loading = false,
  pageTitle = 'Overview Dashboard',
  pageSubtitle = 'Real-time financial performance, operational metrics, and efficiency status',
}: TopFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to push query parameter updates to router
  const updateQueryParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onDateRangeChange(val);
    updateQueryParams('range', val);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onDeptChange(val);
    updateQueryParams('dept', val);
  };

  return (
    <section className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-16 z-30 shadow-sm py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Page Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{pageTitle}</h2>
            {loading && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">{pageSubtitle}</p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Date Range Dropdown */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              id="top-filter-date-range"
              aria-label="Filter by Date Range"
              value={selectedDateRange}
              onChange={handleDateChange}
              className="appearance-none bg-zinc-900 text-zinc-100 font-semibold text-xs py-2 pl-9 pr-8 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
            >
              <option value="last_12_months">Last 12 Months (Default)</option>
              <option value="year_2026">Year 2026</option>
              <option value="year_2025">Year 2025</option>
              <option value="all_time">All Time</option>
            </select>
            <div className="absolute right-2.5 pointer-events-none text-zinc-400 text-[10px]">▼</div>
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              id="top-filter-department"
              aria-label="Filter by Department"
              value={selectedDeptId}
              onChange={handleDeptChange}
              className="appearance-none bg-zinc-900 text-zinc-100 font-semibold text-xs py-2 pl-9 pr-8 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs max-w-[200px] truncate"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 pointer-events-none text-zinc-400 text-[10px]">▼</div>
          </div>

        </div>
      </div>
    </section>
  );
}
