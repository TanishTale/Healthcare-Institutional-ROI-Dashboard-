'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopFilterBar, { DepartmentOption } from '@/components/TopFilterBar';
import { supabase } from '@/lib/supabase';
import { Bed, Clock, Users, RefreshCw, Activity, BarChart3, Table as TableIcon, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function OperationalAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get('range') || 'last_12_months';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>(initialRange);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [clinicalData, setClinicalData] = useState<any[]>([]);
  const [maxDateStr, setMaxDateStr] = useState<string>('2026-09-04');

  // Sync state with URL search params
  useEffect(() => {
    const rangeFromUrl = searchParams.get('range');
    const deptFromUrl = searchParams.get('dept');
    if (rangeFromUrl && rangeFromUrl !== selectedDateRange) setSelectedDateRange(rangeFromUrl);
    if (deptFromUrl && deptFromUrl !== selectedDeptId) setSelectedDeptId(deptFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data, error } = await supabase
          .from('dim_department')
          .select('dept_id, department_name');
        if (error) throw error;
        if (data) setDepartments(data);
      } catch (err: any) {
        console.error('Error fetching departments:', err);
      }
    }
    fetchDepartments();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: opError } = await supabase
        .from('fact_operational_clinical')
        .select('encounter_id, dept_id, admission_date, discharge_date, bed_occupied, satisfaction_score, readmitted_30d');

      if (opError) throw opError;
      setClinicalData(data || []);

      if (data && data.length > 0) {
        const dates = data.map((d: any) => d.admission_date).filter(Boolean);
        if (dates.length > 0) {
          dates.sort();
          setMaxDateStr(dates[dates.length - 1]);
        }
      }
    } catch (err: any) {
      console.error('Error querying operational data:', err);
      setError(err.message || 'Failed to load operational data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  const metrics = useMemo(() => {
    const filtered = clinicalData.filter((c) => {
      const matchDept = selectedDeptId === 'ALL' || c.dept_id === selectedDeptId;
      const matchDate = c.admission_date >= startDate && c.admission_date <= endDate;
      return matchDept && matchDate;
    });

    const throughput = filtered.length;
    const occupiedCount = filtered.filter((c) => c.bed_occupied === 1).length;
    const occupancyRate = throughput > 0 ? (occupiedCount / throughput) * 100 : 0;

    const readmittedCount = filtered.filter((c) => c.readmitted_30d === 1).length;
    const readmissionRate = throughput > 0 ? (readmittedCount / throughput) * 100 : 0;

    // Calculate Average Length of Stay (ALOS)
    let totalLosDays = 0;
    let losCount = 0;
    filtered.forEach((c) => {
      if (c.admission_date && c.discharge_date) {
        const adm = new Date(c.admission_date).getTime();
        const dis = new Date(c.discharge_date).getTime();
        const diffDays = Math.max(1, Math.round((dis - adm) / (1000 * 3600 * 24)));
        totalLosDays += diffDays;
        losCount++;
      }
    });
    const avgLos = losCount > 0 ? totalLosDays / losCount : 0;

    // Bed Occupancy Trend over time
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; occupied: number; total: number }> = {};
    filtered.forEach((c) => {
      const d = new Date(c.admission_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthlyMap[key]) monthlyMap[key] = { monthKey: key, monthLabel: label, occupied: 0, total: 0 };
      monthlyMap[key].total++;
      if (c.bed_occupied === 1) monthlyMap[key].occupied++;
    });

    const occupancyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({
        monthLabel: m.monthLabel,
        occupancyPct: m.total > 0 ? Number(((m.occupied / m.total) * 100).toFixed(1)) : 0,
      }));

    // Department Operational Metrics & ALOS Bar Chart
    const deptNameMap = new Map(departments.map((d) => [d.dept_id, d.department_name]));
    const deptOpMap: Record<string, { total: number; occupied: number; readmitted: number; totalLos: number }> = {};

    departments.forEach((d) => { deptOpMap[d.dept_id] = { total: 0, occupied: 0, readmitted: 0, totalLos: 0 }; });

    clinicalData.forEach((c) => {
      if (c.admission_date >= startDate && c.admission_date <= endDate) {
        if (selectedDeptId === 'ALL' || c.dept_id === selectedDeptId) {
          if (!deptOpMap[c.dept_id]) deptOpMap[c.dept_id] = { total: 0, occupied: 0, readmitted: 0, totalLos: 0 };
          deptOpMap[c.dept_id].total++;
          if (c.bed_occupied === 1) deptOpMap[c.dept_id].occupied++;
          if (c.readmitted_30d === 1) deptOpMap[c.dept_id].readmitted++;

          if (c.admission_date && c.discharge_date) {
            const adm = new Date(c.admission_date).getTime();
            const dis = new Date(c.discharge_date).getTime();
            deptOpMap[c.dept_id].totalLos += Math.max(1, Math.round((dis - adm) / (1000 * 3600 * 24)));
          }
        }
      }
    });

    const deptOpList = Object.entries(deptOpMap)
      .filter(([deptId]) => selectedDeptId === 'ALL' || deptId === selectedDeptId)
      .map(([deptId, val]) => {
        const name = deptNameMap.get(deptId) || deptId;
        const occPct = val.total > 0 ? (val.occupied / val.total) * 100 : 0;
        const readmPct = val.total > 0 ? (val.readmitted / val.total) * 100 : 0;
        const alos = val.total > 0 ? val.totalLos / val.total : 0;

        return {
          dept_id: deptId,
          department_name: name,
          throughput: val.total,
          occupancyPct: occPct,
          alos,
          readmPct,
        };
      });

    const sortedAlosData = [...deptOpList].sort((a, b) => b.alos - a.alos);

    return {
      occupancyRate,
      avgLos,
      throughput,
      readmissionRate,
      occupancyTrend,
      deptOpList,
      sortedAlosData,
    };
  }, [clinicalData, departments, selectedDeptId, startDate, endDate]);

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
        pageTitle="Operational Analytics"
        pageSubtitle="Bed occupancy rates, average length of stay, patient throughput, and 30-day readmissions"
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

        {/* 4 Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bed Occupancy Rate</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><Bed className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Capacity utilization percentage</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Length of Stay (ALOS)</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><Clock className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.avgLos.toFixed(1)} days</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Average inpatient duration</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Patient Throughput</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><Users className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.throughput.toLocaleString()}</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Total completed encounters</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">30-Day Readmission Rate</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><RefreshCw className="w-4 h-4" /></div>
            </div>
            <div className={`text-2xl font-bold ${metrics.readmissionRate > 15 ? 'text-amber-400' : 'text-white'}`}>
              {metrics.readmissionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Unplanned return percentage</p>
          </div>
        </div>

        {/* Line Chart: Bed Occupancy Trend */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              Bed Occupancy Trend Over Time
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Monthly percentage of occupied beds across inpatient departments
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.occupancyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tickFormatter={(val) => `${val}%`} domain={[0, 100]} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Bed Occupancy']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                <Line type="monotone" dataKey="occupancyPct" name="Occupancy %" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: ALOS by Department */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                Average Length of Stay (ALOS) by Department
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Departments ranked by highest average duration of stay (days)
              </p>
            </div>

            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sortedAlosData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <XAxis dataKey="department_name" tick={{ fontSize: 11, fill: '#fafafa', fontWeight: 600 }} axisLine={{ stroke: '#27272a' }} />
                  <YAxis tickFormatter={(val) => `${val} d`} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                  <Tooltip formatter={(val: any) => [`${Number(val).toFixed(1)} days`, 'ALOS']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                  <Bar dataKey="alos" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table: Department Operational Metrics */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-zinc-400" />
                Department Operational Metrics
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Occupancy, ALOS, throughput, and readmission breakdown
              </p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Throughput</th>
                    <th className="py-2.5 px-3">Occupancy</th>
                    <th className="py-2.5 px-3">ALOS</th>
                    <th className="py-2.5 px-3 text-right">Readmission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium text-zinc-300">
                  {metrics.deptOpList.map((row) => (
                    <tr key={row.dept_id} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-3 font-bold text-white">{row.department_name}</td>
                      <td className="py-3 px-3">{row.throughput}</td>
                      <td className="py-3 px-3">{row.occupancyPct.toFixed(1)}%</td>
                      <td className="py-3 px-3">{row.alos.toFixed(1)} days</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {row.readmPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OperationalAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Operational Analytics...</div>}>
      <OperationalAnalyticsContent />
    </Suspense>
  );
}
