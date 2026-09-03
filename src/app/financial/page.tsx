'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopFilterBar, { DepartmentOption } from '@/components/TopFilterBar';
import { supabase } from '@/lib/supabase';
import { formatINR, formatPercent, formatCompactINR } from '@/lib/utils';
import {
  IndianRupee,
  Wallet,
  Percent,
  UserCheck,
  TrendingUp,
  BarChart2,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

function FinancialAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get('range') || 'last_12_months';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentBudgets, setDepartmentBudgets] = useState<Record<string, number>>({});
  
  const [selectedDateRange, setSelectedDateRange] = useState<string>(initialRange);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [financials, setFinancials] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [maxDateStr, setMaxDateStr] = useState<string>('2026-09-04');

  // Sync state with URL params
  useEffect(() => {
    const rangeFromUrl = searchParams.get('range');
    const deptFromUrl = searchParams.get('dept');
    if (rangeFromUrl && rangeFromUrl !== selectedDateRange) setSelectedDateRange(rangeFromUrl);
    if (deptFromUrl && deptFromUrl !== selectedDeptId) setSelectedDeptId(deptFromUrl);
  }, [searchParams]);

  // Fetch department lookup
  useEffect(() => {
    async function fetchDeptData() {
      try {
        const { data, error } = await supabase
          .from('dim_department')
          .select('dept_id, department_name, allocated_budget');

        if (error) throw error;
        if (data) {
          setDepartments(data.map((d: any) => ({ dept_id: d.dept_id, department_name: d.department_name })));
          const bMap: Record<string, number> = {};
          data.forEach((d: any) => { bMap[d.dept_id] = Number(d.allocated_budget || 0); });
          setDepartmentBudgets(bMap);
        }
      } catch (err: any) {
        console.error('Error fetching departments:', err);
      }
    }
    fetchDeptData();
  }, []);

  // Fetch financial & clinical encounter data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: finData, error: finError } = await supabase
        .from('fact_financials')
        .select('transaction_id, dept_id, transaction_date, service_cost, billed_revenue');
      if (finError) throw finError;

      const { data: opData, error: opError } = await supabase
        .from('fact_operational_clinical')
        .select('encounter_id, dept_id, admission_date');
      if (opError) throw opError;

      setFinancials(finData || []);
      setEncounters(opData || []);

      if (finData && finData.length > 0) {
        const dates = finData.map((f: any) => f.transaction_date).filter(Boolean);
        if (dates.length > 0) {
          dates.sort();
          setMaxDateStr(dates[dates.length - 1]);
        }
      }
    } catch (err: any) {
      console.error('Error querying financials:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter boundaries
  const { startDate, endDate } = useMemo(() => {
    const maxD = new Date(maxDateStr);
    let startD = new Date('1900-01-01');
    let endD = new Date('2099-12-31');

    if (selectedDateRange === 'last_12_months') {
      endD = maxD;
      startD = new Date(maxD);
      startD.setFullYear(startD.getFullYear() - 1);
    } else if (selectedDateRange === 'year_2026') {
      startD = new Date('2026-01-01');
      endD = new Date('2026-12-31');
    } else if (selectedDateRange === 'year_2025') {
      startD = new Date('2025-01-01');
      endD = new Date('2025-12-31');
    }
    return {
      startDate: startD.toISOString().split('T')[0],
      endDate: endD.toISOString().split('T')[0],
    };
  }, [selectedDateRange, maxDateStr]);

  // Financial Computations
  const metrics = useMemo(() => {
    const filteredFin = financials.filter((f) => {
      const matchDept = selectedDeptId === 'ALL' || f.dept_id === selectedDeptId;
      const matchDate = f.transaction_date >= startDate && f.transaction_date <= endDate;
      return matchDept && matchDate;
    });

    const filteredEnc = encounters.filter((e) => {
      const matchDept = selectedDeptId === 'ALL' || e.dept_id === selectedDeptId;
      const matchDate = e.admission_date >= startDate && e.admission_date <= endDate;
      return matchDept && matchDate;
    });

    const totalRevenue = filteredFin.reduce((acc, f) => acc + Number(f.billed_revenue || 0), 0);
    const totalExpenditure = filteredFin.reduce((acc, f) => acc + Number(f.service_cost || 0), 0);
    const netProfit = totalRevenue - totalExpenditure;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const patientCount = filteredEnc.length;
    const costPerPatient = patientCount > 0 ? totalExpenditure / patientCount : 0;

    // Monthly Trend Line Chart
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; revenue: number; cost: number }> = {};

    filteredFin.forEach((f) => {
      const d = new Date(f.transaction_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = { monthKey: key, monthLabel: label, revenue: 0, cost: 0 };
      }
      monthlyMap[key].revenue += Number(f.billed_revenue || 0);
      monthlyMap[key].cost += Number(f.service_cost || 0);
    });

    const monthlyTrendData = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Department Table & ROI Bar Chart
    const deptNameMap = new Map(departments.map((d) => [d.dept_id, d.department_name]));
    const deptFinMap: Record<string, { revenue: number; cost: number }> = {};

    departments.forEach((d) => { deptFinMap[d.dept_id] = { revenue: 0, cost: 0 }; });

    financials.forEach((f) => {
      if (f.transaction_date >= startDate && f.transaction_date <= endDate) {
        if (selectedDeptId === 'ALL' || f.dept_id === selectedDeptId) {
          if (!deptFinMap[f.dept_id]) deptFinMap[f.dept_id] = { revenue: 0, cost: 0 };
          deptFinMap[f.dept_id].revenue += Number(f.billed_revenue || 0);
          deptFinMap[f.dept_id].cost += Number(f.service_cost || 0);
        }
      }
    });

    const departmentPerformanceList = Object.entries(deptFinMap)
      .filter(([deptId]) => selectedDeptId === 'ALL' || deptId === selectedDeptId)
      .map(([deptId, val]) => {
        const name = deptNameMap.get(deptId) || deptId;
        const netP = val.revenue - val.cost;
        const marginPct = val.revenue > 0 ? (netP / val.revenue) * 100 : 0;
        const budget = departmentBudgets[deptId] || 1;
        const roi = (netP / budget) * 100;

        return {
          dept_id: deptId,
          department_name: name,
          revenue: val.revenue,
          cost: val.cost,
          netProfit: netP,
          marginPct,
          allocatedBudget: budget,
          roi,
        };
      });

    // Sort worst margin first (losses at top)
    const sortedTableData = [...departmentPerformanceList].sort((a, b) => a.marginPct - b.marginPct);

    // Sort ROI chart best to worst
    const sortedRoiChartData = [...departmentPerformanceList].sort((a, b) => b.roi - a.roi);

    return {
      totalRevenue,
      totalExpenditure,
      netMarginPct,
      costPerPatient,
      patientCount,
      monthlyTrendData,
      sortedTableData,
      sortedRoiChartData,
    };
  }, [financials, encounters, departments, departmentBudgets, selectedDeptId, startDate, endDate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <TopFilterBar
        departments={departments}
        selectedDateRange={selectedDateRange}
        selectedDeptId={selectedDeptId}
        onDateRangeChange={setSelectedDateRange}
        onDeptChange={setSelectedDeptId}
        loading={loading}
        pageTitle="Financial Analytics"
        pageSubtitle="Department revenue breakdowns, cost per patient, net margins, and institutional ROI"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {error && (
          <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 p-4 rounded-[12px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <p className="font-bold text-sm text-white">{error}</p>
            </div>
            <button onClick={fetchData} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><IndianRupee className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{formatINR(metrics.totalRevenue)}</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Gross billed patient revenue</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Expenditure</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><Wallet className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{formatINR(metrics.totalExpenditure)}</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Direct operational service costs</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Net Margin %</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><Percent className="w-4 h-4" /></div>
            </div>
            <div className={`text-2xl font-bold ${metrics.netMarginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(metrics.netMarginPct, true)}
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">(Revenue - Cost) / Revenue</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cost per Patient</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><UserCheck className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{formatINR(metrics.costPerPatient)}</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Across {metrics.patientCount} encounters</p>
          </div>
        </div>

        {/* Line Chart: Revenue vs Expenditure Trend */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              Revenue vs Expenditure Over Time
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Monthly trajectory of gross billed revenue against operational service costs
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tickFormatter={(val) => formatCompactINR(val)} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <Tooltip formatter={(value: any) => [formatINR(Number(value)), '']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="revenue" name="Billed Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cost" name="Service Cost" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Department Financial Performance */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-zinc-400" />
                Department Financial Performance
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Sorted worst margin first so loss-making departments appear at the top
              </p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Revenue</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3 text-right">Net Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {metrics.sortedTableData.map((row) => {
                    const isLoss = row.marginPct < 0;
                    return (
                      <tr key={row.dept_id} className={`hover:bg-zinc-800/40 ${isLoss ? 'bg-rose-950/20' : ''}`}>
                        <td className="py-3 px-3 font-bold text-white">{row.department_name}</td>
                        <td className="py-3 px-3 text-zinc-300">{formatINR(row.revenue)}</td>
                        <td className="py-3 px-3 text-zinc-300">{formatINR(row.cost)}</td>
                        <td className={`py-3 px-3 text-right font-bold font-mono ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatPercent(row.marginPct, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart: ROI per Department */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-zinc-400" />
                Institutional ROI by Department
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                (Billed Revenue - Service Cost) / Allocated Budget * 100
              </p>
            </div>

            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sortedRoiChartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <XAxis dataKey="department_name" tick={{ fontSize: 11, fill: '#fafafa', fontWeight: 600 }} axisLine={{ stroke: '#27272a' }} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                  <Tooltip formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'ROI']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                  <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
                  <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                    {metrics.sortedRoiChartData.map((entry, idx) => (
                      <Cell key={`roi-${idx}`} fill={entry.roi >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function FinancialAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Financial Analytics...</div>}>
      <FinancialAnalyticsContent />
    </Suspense>
  );
}
