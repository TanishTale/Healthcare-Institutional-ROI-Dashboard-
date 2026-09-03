'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopFilterBar, { DepartmentOption } from '@/components/TopFilterBar';
import { supabase } from '@/lib/supabase';
import { Star, RefreshCw, ShieldCheck, HeartPulse, BarChart3, TrendingUp, Layers, AlertCircle } from 'lucide-react';
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
} from 'recharts';

function ClinicalAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get('range') || 'last_12_months';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>(initialRange);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [clinicalData, setClinicalData] = useState<any[]>([]);
  const [patientMap, setPatientMap] = useState<Record<string, string>>({});
  const [maxDateStr, setMaxDateStr] = useState<string>('2026-09-04');

  // Sync state with URL search params
  useEffect(() => {
    const rangeFromUrl = searchParams.get('range');
    const deptFromUrl = searchParams.get('dept');
    if (rangeFromUrl && rangeFromUrl !== selectedDateRange) setSelectedDateRange(rangeFromUrl);
    if (deptFromUrl && deptFromUrl !== selectedDeptId) setSelectedDeptId(deptFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function initData() {
      try {
        const { data: deptData } = await supabase.from('dim_department').select('dept_id, department_name');
        if (deptData) setDepartments(deptData);

        const { data: patData } = await supabase.from('dim_patient').select('patient_id, risk_category');
        if (patData) {
          const pMap: Record<string, string> = {};
          patData.forEach((p: any) => { pMap[p.patient_id] = p.risk_category || 'Low'; });
          setPatientMap(pMap);
        }
      } catch (err: any) {
        console.error('Error fetching clinical lookup:', err);
      }
    }
    initData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: opError } = await supabase
        .from('fact_operational_clinical')
        .select('encounter_id, patient_id, dept_id, admission_date, satisfaction_score, readmitted_30d');

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
      console.error('Error querying clinical data:', err);
      setError(err.message || 'Failed to load clinical quality data');
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

    const totalEnc = filtered.length;

    // Average Satisfaction Score
    const totalScore = filtered.reduce((acc, c) => acc + Number(c.satisfaction_score || 0), 0);
    const avgSatisfaction = totalEnc > 0 ? totalScore / totalEnc : 0;

    // Readmission Rate
    const readmCount = filtered.filter((c) => c.readmitted_30d === 1).length;
    const readmissionRate = totalEnc > 0 ? (readmCount / totalEnc) * 100 : 0;

    // Patient Volume by Risk Category
    let lowRiskCount = 0;
    let medRiskCount = 0;
    let highRiskCount = 0;

    filtered.forEach((c) => {
      const cat = patientMap[c.patient_id] || 'Low';
      if (cat === 'High') highRiskCount++;
      else if (cat === 'Medium') medRiskCount++;
      else lowRiskCount++;
    });

    // Satisfaction by Department Bar Chart
    const deptNameMap = new Map(departments.map((d) => [d.dept_id, d.department_name]));
    const deptSatMap: Record<string, { totalScore: number; count: number }> = {};
    departments.forEach((d) => { deptSatMap[d.dept_id] = { totalScore: 0, count: 0 }; });

    clinicalData.forEach((c) => {
      if (c.admission_date >= startDate && c.admission_date <= endDate) {
        if (selectedDeptId === 'ALL' || c.dept_id === selectedDeptId) {
          if (!deptSatMap[c.dept_id]) deptSatMap[c.dept_id] = { totalScore: 0, count: 0 };
          deptSatMap[c.dept_id].totalScore += Number(c.satisfaction_score || 0);
          deptSatMap[c.dept_id].count++;
        }
      }
    });

    const satisfactionByDept = Object.entries(deptSatMap)
      .filter(([deptId]) => selectedDeptId === 'ALL' || deptId === selectedDeptId)
      .map(([deptId, val]) => ({
        dept_id: deptId,
        department_name: deptNameMap.get(deptId) || deptId,
        avgScore: val.count > 0 ? Number((val.totalScore / val.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Readmission Rate Trend Line Chart
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; readmitted: number; total: number }> = {};
    filtered.forEach((c) => {
      const d = new Date(c.admission_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthlyMap[key]) monthlyMap[key] = { monthKey: key, monthLabel: label, readmitted: 0, total: 0 };
      monthlyMap[key].total++;
      if (c.readmitted_30d === 1) monthlyMap[key].readmitted++;
    });

    const readmissionTrend = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({
        monthLabel: m.monthLabel,
        readmissionPct: m.total > 0 ? Number(((m.readmitted / m.total) * 100).toFixed(1)) : 0,
      }));

    // Stacked Bar Chart: Risk Category per Department
    const deptRiskMap: Record<string, { Low: number; Medium: number; High: number }> = {};
    departments.forEach((d) => { deptRiskMap[d.dept_id] = { Low: 0, Medium: 0, High: 0 }; });

    clinicalData.forEach((c) => {
      if (c.admission_date >= startDate && c.admission_date <= endDate) {
        if (selectedDeptId === 'ALL' || c.dept_id === selectedDeptId) {
          if (!deptRiskMap[c.dept_id]) deptRiskMap[c.dept_id] = { Low: 0, Medium: 0, High: 0 };
          const cat = (patientMap[c.patient_id] || 'Low') as 'Low' | 'Medium' | 'High';
          deptRiskMap[c.dept_id][cat]++;
        }
      }
    });

    const stackedRiskData = Object.entries(deptRiskMap)
      .filter(([deptId]) => selectedDeptId === 'ALL' || deptId === selectedDeptId)
      .map(([deptId, val]) => ({
        dept_id: deptId,
        department_name: deptNameMap.get(deptId) || deptId,
        Low: val.Low,
        Medium: val.Medium,
        High: val.High,
      }));

    return {
      avgSatisfaction,
      readmissionRate,
      lowRiskCount,
      medRiskCount,
      highRiskCount,
      satisfactionByDept,
      readmissionTrend,
      stackedRiskData,
    };
  }, [clinicalData, patientMap, departments, selectedDeptId, startDate, endDate]);

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
        pageTitle="Clinical & Quality Analytics"
        pageSubtitle="Aggregate patient satisfaction, readmission trends, and risk profile distribution"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Privacy & Compliance Banner */}
        <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-[12px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              De-Identified Institutional Quality Notice
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              This dashboard displays safe aggregate clinical quality metrics only. Individual patient identifiers are strictly masked for HIPAA privacy compliance.
            </p>
          </div>
        </div>

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

        {/* 3 Clinical KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Patient Satisfaction</span>
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400"><Star className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.avgSatisfaction.toFixed(2)} / 10</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Post-discharge satisfaction survey score</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">30-Day Readmission Rate</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><RefreshCw className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.readmissionRate.toFixed(1)}%</div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Unplanned 30-day return rate</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Patient Risk Distribution</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300"><HeartPulse className="w-4 h-4" /></div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-1 rounded">Low: {metrics.lowRiskCount}</span>
              <span className="text-xs font-bold text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2 py-1 rounded">Med: {metrics.medRiskCount}</span>
              <span className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-1 rounded">High: {metrics.highRiskCount}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-medium">Encounters grouped by patient risk tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: Satisfaction Score by Department */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                Average Satisfaction Score by Department
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Satisfaction rated on 1-10 scale across clinical departments
              </p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.satisfactionByDept} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <XAxis dataKey="department_name" tick={{ fontSize: 11, fill: '#fafafa', fontWeight: 600 }} axisLine={{ stroke: '#27272a' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                  <Tooltip formatter={(val: any) => [`${val} / 10`, 'Satisfaction Score']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart: Readmission Rate Trend */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                Readmission Rate Trend Over Time
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Monthly percentage of patients readmitted within 30 days of discharge
              </p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.readmissionTrend} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                  <YAxis tickFormatter={(val) => `${val}%`} domain={[0, 30]} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Readmission Rate']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                  <Line type="monotone" dataKey="readmissionPct" name="Readmission %" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart: Risk Category per Department */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              Patient Risk Profile Breakdown by Department
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Stacked encounter count across Low, Medium, and High clinical risk tiers
            </p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.stackedRiskData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <XAxis dataKey="department_name" tick={{ fontSize: 11, fill: '#fafafa', fontWeight: 600 }} axisLine={{ stroke: '#27272a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Low" name="Low Risk" stackId="risk" fill="#10b981" />
                <Bar dataKey="Medium" name="Medium Risk" stackId="risk" fill="#3b82f6" />
                <Bar dataKey="High" name="High Risk" stackId="risk" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ClinicalAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Clinical Analytics...</div>}>
      <ClinicalAnalyticsContent />
    </Suspense>
  );
}
