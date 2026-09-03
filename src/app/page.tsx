'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopFilterBar, { DepartmentOption } from '@/components/TopFilterBar';
import AlertBanner, { EfficiencyWarningItem } from '@/components/AlertBanner';
import HeadlineCards from '@/components/HeadlineCards';
import KpiRow from '@/components/KpiRow';
import DepartmentProfitChart, { DepartmentProfitItem } from '@/components/DepartmentProfitChart';
import { supabase } from '@/lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

function OverviewDashboardContent() {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get('range') || 'last_12_months';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentBudgets, setDepartmentBudgets] = useState<Record<string, number>>({});
  
  const [selectedDateRange, setSelectedDateRange] = useState<string>(initialRange);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state if URL query params change externally
  useEffect(() => {
    const rangeFromUrl = searchParams.get('range');
    const deptFromUrl = searchParams.get('dept');
    if (rangeFromUrl && rangeFromUrl !== selectedDateRange) {
      setSelectedDateRange(rangeFromUrl);
    }
    if (deptFromUrl && deptFromUrl !== selectedDeptId) {
      setSelectedDeptId(deptFromUrl);
    }
  }, [searchParams]);

  // Raw data from Supabase queries
  const [financials, setFinancials] = useState<any[]>([]);
  const [clinicalData, setClinicalData] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

  // Max dataset date to anchor "Last 12 Months" filter dynamically
  const [maxDateStr, setMaxDateStr] = useState<string>('2026-09-04');

  // Load initial departments list
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data, error } = await supabase
          .from('dim_department')
          .select('dept_id, department_name, allocated_budget');

        if (error) throw error;
        if (data) {
          const deptList = data.map((d: any) => ({
            dept_id: d.dept_id,
            department_name: d.department_name,
          }));
          setDepartments(deptList);

          const budgetMap: Record<string, number> = {};
          data.forEach((d: any) => {
            budgetMap[d.dept_id] = Number(d.allocated_budget || 0);
          });
          setDepartmentBudgets(budgetMap);
        }
      } catch (err: any) {
        console.error('Error fetching departments:', err);
      }
    }

    fetchDepartments();
  }, []);

  // Primary data fetcher function
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Query fact_financials
      const { data: finData, error: finError } = await supabase
        .from('fact_financials')
        .select('transaction_id, dept_id, transaction_date, service_cost, billed_revenue');

      if (finError) throw finError;

      // 2. Query fact_operational_clinical
      const { data: opData, error: opError } = await supabase
        .from('fact_operational_clinical')
        .select('encounter_id, dept_id, admission_date, bed_occupied');

      if (opError) throw opError;

      // 3. Query fact_efficiency_warnings
      const { data: warnData, error: warnError } = await supabase
        .from('fact_efficiency_warnings')
        .select('warning_id, dept_id, evaluation_date, underperforming_flag, early_warning_score, inefficiency_driver');

      if (warnError) throw warnError;

      setFinancials(finData || []);
      setClinicalData(opData || []);
      setWarnings(warnData || []);

      // Determine max date from financials to anchor "Last 12 Months"
      if (finData && finData.length > 0) {
        const dates = finData.map((f: any) => f.transaction_date).filter(Boolean);
        if (dates.length > 0) {
          dates.sort();
          const maxD = dates[dates.length - 1];
          setMaxDateStr(maxD);
        }
      }
    } catch (err: any) {
      console.error('Error querying Supabase tables:', err);
      setError(err.message || 'Failed to load live data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute date filter boundaries based on selectedDateRange and maxDateStr
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const maxD = new Date(maxDateStr);
    let startD = new Date('1900-01-01');
    let endD = new Date('2099-12-31');

    let pStartD: Date | null = null;
    let pEndD: Date | null = null;

    if (selectedDateRange === 'last_12_months') {
      endD = maxD;
      startD = new Date(maxD);
      startD.setFullYear(startD.getFullYear() - 1);

      pEndD = new Date(startD);
      pEndD.setDate(pEndD.getDate() - 1);
      pStartD = new Date(pEndD);
      pStartD.setFullYear(pStartD.getFullYear() - 1);
    } else if (selectedDateRange === 'year_2026') {
      startD = new Date('2026-01-01');
      endD = new Date('2026-12-31');

      pStartD = new Date('2025-01-01');
      pEndD = new Date('2025-12-31');
    } else if (selectedDateRange === 'year_2025') {
      startD = new Date('2025-01-01');
      endD = new Date('2025-12-31');

      pStartD = new Date('2024-01-01');
      pEndD = new Date('2024-12-31');
    } else {
      // all_time
      startD = new Date('1900-01-01');
      endD = new Date('2099-12-31');
    }

    return {
      startDate: startD.toISOString().split('T')[0],
      endDate: endD.toISOString().split('T')[0],
      prevStartDate: pStartD ? pStartD.toISOString().split('T')[0] : null,
      prevEndDate: pEndD ? pEndD.toISOString().split('T')[0] : null,
    };
  }, [selectedDateRange, maxDateStr]);

  // Compute Dashboard Metrics from live data
  const metrics = useMemo(() => {
    // 1. Filter Financials
    const filteredFin = financials.filter((f) => {
      const matchDept = selectedDeptId === 'ALL' || f.dept_id === selectedDeptId;
      const matchDate = f.transaction_date >= startDate && f.transaction_date <= endDate;
      return matchDept && matchDate;
    });

    const totalRevenue = filteredFin.reduce((acc, f) => acc + Number(f.billed_revenue || 0), 0);
    const totalExpenditure = filteredFin.reduce((acc, f) => acc + Number(f.service_cost || 0), 0);
    const netProfit = totalRevenue - totalExpenditure;

    // 2. Previous Period Financials for % change
    let pctChangeVsPrev: number | null = null;
    if (prevStartDate && prevEndDate) {
      const prevFin = financials.filter((f) => {
        const matchDept = selectedDeptId === 'ALL' || f.dept_id === selectedDeptId;
        const matchDate = f.transaction_date >= prevStartDate && f.transaction_date <= prevEndDate;
        return matchDept && matchDate;
      });

      const prevRev = prevFin.reduce((acc, f) => acc + Number(f.billed_revenue || 0), 0);
      const prevExp = prevFin.reduce((acc, f) => acc + Number(f.service_cost || 0), 0);
      const prevNetProfit = prevRev - prevExp;

      if (Math.abs(prevNetProfit) > 0) {
        pctChangeVsPrev = ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;
      }
    }

    // 3. Overall ROI Calculation
    let totalBudget = 0;
    if (selectedDeptId === 'ALL') {
      totalBudget = Object.values(departmentBudgets).reduce((a, b) => a + b, 0);
    } else {
      totalBudget = departmentBudgets[selectedDeptId] || 0;
    }

    const overallRoi = totalBudget > 0 ? (netProfit / totalBudget) * 100 : 0;

    // 4. Bed Occupancy Rate
    const filteredOp = clinicalData.filter((c) => {
      const matchDept = selectedDeptId === 'ALL' || c.dept_id === selectedDeptId;
      const matchDate = c.admission_date >= startDate && c.admission_date <= endDate;
      return matchDept && matchDate;
    });

    const totalEncounters = filteredOp.length;
    const occupiedCount = filteredOp.filter((c) => c.bed_occupied === 1).length;
    const bedOccupancyRate = totalEncounters > 0 ? (occupiedCount / totalEncounters) * 100 : 0;

    // 5. Active Efficiency Warnings
    const filteredWarn = warnings.filter((w) => {
      const matchDept = selectedDeptId === 'ALL' || w.dept_id === selectedDeptId;
      const matchDate = w.evaluation_date >= startDate && w.evaluation_date <= endDate;
      return matchDept && matchDate;
    });

    const activeWarningsCount = filteredWarn.filter((w) => w.underperforming_flag === 1).length;

    // Format warning objects with department_name for AlertBanner
    const deptNameMap = new Map(departments.map((d) => [d.dept_id, d.department_name]));
    const formattedWarnings: EfficiencyWarningItem[] = filteredWarn.map((w) => ({
      warning_id: w.warning_id,
      dept_id: w.dept_id,
      department_name: deptNameMap.get(w.dept_id) || w.dept_id,
      evaluation_date: w.evaluation_date,
      underperforming_flag: Number(w.underperforming_flag || 0),
      early_warning_score: Number(w.early_warning_score || 0),
      inefficiency_driver: w.inefficiency_driver || 'Operational Bottleneck',
    }));

    // 6. Department Profit Breakdown for Horizontal Bar Chart
    const deptProfitMap: Record<string, { rev: number; cost: number }> = {};
    departments.forEach((d) => {
      deptProfitMap[d.dept_id] = { rev: 0, cost: 0 };
    });

    // Sum financials grouped by department for current date filter
    financials.forEach((f) => {
      if (f.transaction_date >= startDate && f.transaction_date <= endDate) {
        if (selectedDeptId === 'ALL' || f.dept_id === selectedDeptId) {
          if (!deptProfitMap[f.dept_id]) {
            deptProfitMap[f.dept_id] = { rev: 0, cost: 0 };
          }
          deptProfitMap[f.dept_id].rev += Number(f.billed_revenue || 0);
          deptProfitMap[f.dept_id].cost += Number(f.service_cost || 0);
        }
      }
    });

    const departmentProfitData: DepartmentProfitItem[] = Object.entries(deptProfitMap)
      .filter(([deptId]) => selectedDeptId === 'ALL' || deptId === selectedDeptId)
      .map(([deptId, val]) => {
        const name = deptNameMap.get(deptId) || deptId;
        const netP = val.rev - val.cost;
        return {
          dept_id: deptId,
          department_name: name,
          billed_revenue: val.rev,
          service_cost: val.cost,
          netProfit: netP,
        };
      });

    return {
      netProfit,
      pctChangeVsPrev,
      overallRoi,
      totalBudget,
      totalRevenue,
      totalExpenditure,
      bedOccupancyRate,
      activeWarningsCount,
      formattedWarnings,
      departmentProfitData,
      totalEncounters,
      filteredFinCount: filteredFin.length,
    };
  }, [
    financials,
    clinicalData,
    warnings,
    departments,
    departmentBudgets,
    selectedDeptId,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Top Sticky Filter Bar */}
      <TopFilterBar
        departments={departments}
        selectedDateRange={selectedDateRange}
        selectedDeptId={selectedDeptId}
        onDateRangeChange={setSelectedDateRange}
        onDeptChange={setSelectedDeptId}
        loading={loading}
        pageTitle="Overview Dashboard"
        pageSubtitle="Real-time financial performance, operational metrics, and efficiency status"
      />

      {/* Dashboard Body */}
      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 p-4 rounded-[12px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Database Query Error</p>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Two Large Headline Cards Side-by-Side (Dark Mode with Radial Glow) */}
        <HeadlineCards
          netProfit={metrics.netProfit}
          pctChangeVsPrev={metrics.pctChangeVsPrev}
          overallRoi={metrics.overallRoi}
          totalAllocatedBudget={metrics.totalBudget}
          loading={loading}
        />

        {/* Row of 4 Bento KPI Cards */}
        <KpiRow
          totalRevenue={metrics.totalRevenue}
          totalExpenditure={metrics.totalExpenditure}
          bedOccupancyRate={metrics.bedOccupancyRate}
          activeWarningsCount={metrics.activeWarningsCount}
          loading={loading}
        />

        {/* Empty Data Warning */}
        {!loading && metrics.filteredFinCount === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-6 text-center text-zinc-400 my-4">
            <p className="font-semibold text-sm text-zinc-200">No data found for this period</p>
            <p className="text-xs text-zinc-400 mt-1">
              Try selecting "Last 12 Months" or "All Time" to view database transactions.
            </p>
          </div>
        )}

        {/* Profit/loss by department Horizontal Bar Chart */}
        <DepartmentProfitChart
          data={metrics.departmentProfitData}
          loading={loading}
        />

        {/* Institutional Efficiency Warning Banner (Moved below Profit / Loss by Department) */}
        {!loading && <AlertBanner warnings={metrics.formattedWarnings} />}
      </main>

      {/* Column Footer */}
      <Footer />
    </div>
  );
}

export default function OverviewDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-zinc-400 font-medium text-sm animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          Loading Aarogya Analytics Dashboard...
        </div>
      </div>
    }>
      <OverviewDashboardContent />
    </Suspense>
  );
}
