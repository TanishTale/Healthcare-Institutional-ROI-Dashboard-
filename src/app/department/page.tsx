'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopFilterBar, { DepartmentOption } from '@/components/TopFilterBar';
import { supabase } from '@/lib/supabase';
import { formatPercent } from '@/lib/utils';
import { Building2, Radar as RadarIcon, Table as TableIcon, Award, AlertCircle, RefreshCw, ArrowUpDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';

function DepartmentPerformanceContent() {
  const searchParams = useSearchParams();
  const initialRange = searchParams.get('range') || 'last_12_months';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>(initialRange);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);

  // Radar comparison selections
  const [radarDept1, setRadarDept1] = useState<string>('');
  const [radarDept2, setRadarDept2] = useState<string>('');

  // Table sorting
  const [sortField, setSortField] = useState<string>('compositeScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [financials, setFinancials] = useState<any[]>([]);
  const [clinicalData, setClinicalData] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [maxDateStr, setMaxDateStr] = useState<string>('2026-09-04');

  // Sync state with URL params
  useEffect(() => {
    const rangeFromUrl = searchParams.get('range');
    const deptFromUrl = searchParams.get('dept');
    if (rangeFromUrl && rangeFromUrl !== selectedDateRange) setSelectedDateRange(rangeFromUrl);
    if (deptFromUrl && deptFromUrl !== selectedDeptId) setSelectedDeptId(deptFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const { data } = await supabase.from('dim_department').select('dept_id, department_name');
        if (data && data.length > 0) {
          setDepartments(data);
          setRadarDept1(data[0].dept_id);
          if (data.length > 1) setRadarDept2(data[1].dept_id);
          else setRadarDept2(data[0].dept_id);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    }
    fetchDepts();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: finData } = await supabase.from('fact_financials').select('dept_id, transaction_date, service_cost, billed_revenue');
      const { data: opData } = await supabase.from('fact_operational_clinical').select('dept_id, admission_date, discharge_date, bed_occupied, satisfaction_score, readmitted_30d');
      const { data: warnData } = await supabase.from('fact_efficiency_warnings').select('dept_id, evaluation_date, early_warning_score');

      setFinancials(finData || []);
      setClinicalData(opData || []);
      setWarnings(warnData || []);

      if (finData && finData.length > 0) {
        const dates = finData.map((f: any) => f.transaction_date).filter(Boolean);
        if (dates.length > 0) {
          dates.sort();
          setMaxDateStr(dates[dates.length - 1]);
        }
      }
    } catch (err: any) {
      console.error('Error querying department data:', err);
      setError(err.message || 'Failed to load department metrics');
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

  // Composite Performance Score Calculation
  const metrics = useMemo(() => {
    const deptMap: Record<string, {
      name: string;
      revenue: number;
      cost: number;
      opTotal: number;
      occupied: number;
      totalLos: number;
      totalSat: number;
      readmitted: number;
      warningScoreSum: number;
      warningCount: number;
    }> = {};

    departments.forEach((d) => {
      deptMap[d.dept_id] = {
        name: d.department_name,
        revenue: 0,
        cost: 0,
        opTotal: 0,
        occupied: 0,
        totalLos: 0,
        totalSat: 0,
        readmitted: 0,
        warningScoreSum: 0,
        warningCount: 0,
      };
    });

    financials.forEach((f) => {
      if (f.transaction_date >= startDate && f.transaction_date <= endDate) {
        if (deptMap[f.dept_id]) {
          deptMap[f.dept_id].revenue += Number(f.billed_revenue || 0);
          deptMap[f.dept_id].cost += Number(f.service_cost || 0);
        }
      }
    });

    clinicalData.forEach((c) => {
      if (c.admission_date >= startDate && c.admission_date <= endDate) {
        if (deptMap[c.dept_id]) {
          deptMap[c.dept_id].opTotal++;
          if (c.bed_occupied === 1) deptMap[c.dept_id].occupied++;
          if (c.readmitted_30d === 1) deptMap[c.dept_id].readmitted++;
          deptMap[c.dept_id].totalSat += Number(c.satisfaction_score || 0);

          if (c.admission_date && c.discharge_date) {
            const adm = new Date(c.admission_date).getTime();
            const dis = new Date(c.discharge_date).getTime();
            deptMap[c.dept_id].totalLos += Math.max(1, Math.round((dis - adm) / (1000 * 3600 * 24)));
          }
        }
      }
    });

    warnings.forEach((w) => {
      if (w.evaluation_date >= startDate && w.evaluation_date <= endDate) {
        if (deptMap[w.dept_id]) {
          deptMap[w.dept_id].warningScoreSum += Number(w.early_warning_score || 0);
          deptMap[w.dept_id].warningCount++;
        }
      }
    });

    const rawList = Object.entries(deptMap).map(([dept_id, val]) => {
      const netP = val.revenue - val.cost;
      const marginPct = val.revenue > 0 ? (netP / val.revenue) * 100 : 0;
      const occupancyPct = val.opTotal > 0 ? (val.occupied / val.opTotal) * 100 : 0;
      const alos = val.opTotal > 0 ? val.totalLos / val.opTotal : 0;
      const satisfaction = val.opTotal > 0 ? val.totalSat / val.opTotal : 0;
      const readmissionPct = val.opTotal > 0 ? (val.readmitted / val.opTotal) * 100 : 0;
      const avgWarningScore = val.warningCount > 0 ? val.warningScoreSum / val.warningCount : 0;

      // Sub-scores normalized to 0-100 scale:
      const finSubScore = Math.max(0, Math.min(100, (marginPct + 10) * (100 / 30)));
      const opSubScore = Math.max(0, Math.min(100, occupancyPct * 0.7 + (15 - alos) * 2));
      const clinSubScore = Math.max(0, Math.min(100, satisfaction * 8 + (25 - readmissionPct) * 0.8));
      const warnSubScore = Math.max(0, Math.min(100, 100 - avgWarningScore));

      const compositeScore = Number(
        (finSubScore * 0.3 + opSubScore * 0.3 + clinSubScore * 0.2 + warnSubScore * 0.2).toFixed(1)
      );

      return {
        dept_id,
        department_name: val.name,
        compositeScore,
        finSubScore: Number(finSubScore.toFixed(1)),
        opSubScore: Number(opSubScore.toFixed(1)),
        clinSubScore: Number(clinSubScore.toFixed(1)),
        warnSubScore: Number(warnSubScore.toFixed(1)),
        marginPct: Number(marginPct.toFixed(1)),
        occupancyPct: Number(occupancyPct.toFixed(1)),
        alos: Number(alos.toFixed(1)),
        satisfaction: Number(satisfaction.toFixed(2)),
        readmissionPct: Number(readmissionPct.toFixed(1)),
        avgWarningScore: Number(avgWarningScore.toFixed(1)),
      };
    });

    const sortedRanked = [...rawList].sort((a, b) => b.compositeScore - a.compositeScore);

    return { rawList, sortedRanked };
  }, [financials, clinicalData, warnings, departments, startDate, endDate]);

  // Sort handler for comparison table
  const sortedTableData = useMemo(() => {
    return [...metrics.rawList].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [metrics.rawList, sortField, sortAsc]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Radar Data for selected 2 departments
  const radarData = useMemo(() => {
    const d1 = metrics.rawList.find((d) => d.dept_id === radarDept1);
    const d2 = metrics.rawList.find((d) => d.dept_id === radarDept2);

    const name1 = d1 ? d1.department_name : 'Dept 1';
    const name2 = d2 ? d2.department_name : 'Dept 2';

    return {
      name1,
      name2,
      data: [
        { metric: 'Financial Performance', [name1]: d1?.finSubScore || 0, [name2]: d2?.finSubScore || 0 },
        { metric: 'Operational Efficiency', [name1]: d1?.opSubScore || 0, [name2]: d2?.opSubScore || 0 },
        { metric: 'Clinical Quality', [name1]: d1?.clinSubScore || 0, [name2]: d2?.clinSubScore || 0 },
        { metric: 'Low-Risk Safety Index', [name1]: d1?.warnSubScore || 0, [name2]: d2?.warnSubScore || 0 },
      ],
    };
  }, [metrics.rawList, radarDept1, radarDept2]);

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
        pageTitle="Department Performance"
        pageSubtitle="Side-by-side composite performance scoring (Financial 30%, Operational 30%, Clinical 20%, Safety 20%)"
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

        {/* Ranked Horizontal Bar Chart: Composite Score */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-zinc-400" />
                Institutional Composite Performance Ranking
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Departments scored from 0-100 across financial margin, bed efficiency, satisfaction, & safety
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-1 rounded">Top Performer</span>
              <span className="flex items-center gap-1 text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-1 rounded">Needs Support</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metrics.sortedRanked} margin={{ top: 10, right: 80, left: 40, bottom: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={{ stroke: '#27272a' }} />
                <YAxis dataKey="department_name" type="category" tick={{ fontSize: 12, fill: '#fafafa', fontWeight: 600 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={(val: any) => [`${val} / 100`, 'Composite Score']} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                <Bar dataKey="compositeScore" radius={[0, 4, 4, 0]} barSize={24}>
                  {metrics.sortedRanked.map((entry, idx) => {
                    const color = entry.compositeScore >= 70 ? '#10b981' : entry.compositeScore >= 50 ? '#3b82f6' : '#f43f5e';
                    return <Cell key={`comp-${idx}`} fill={color} />;
                  })}
                  <LabelList dataKey="compositeScore" position="right" formatter={(val: any) => `${val}/100`} style={{ fontSize: 12, fontWeight: 700, fill: '#fafafa' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart Component: Compare 2 Selected Departments */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <RadarIcon className="w-4 h-4 text-zinc-400" />
                  2-Department Radar Comparison
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Compare performance across all 4 sub-scores
                </p>
              </div>
            </div>

            {/* Department Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div>
                <label className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Dept 1 (Blue)</label>
                <select
                  value={radarDept1}
                  onChange={(e) => setRadarDept1(e.target.value)}
                  className="w-full text-xs font-semibold py-1.5 px-2 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.dept_id} value={d.dept_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Dept 2 (Green)</label>
                <select
                  value={radarDept2}
                  onChange={(e) => setRadarDept2(e.target.value)}
                  className="w-full text-xs font-semibold py-1.5 px-2 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d.dept_id} value={d.dept_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={85} data={radarData.data}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#fafafa', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                  <Radar name={radarData.name1} dataKey={radarData.name1} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Radar name={radarData.name2} dataKey={radarData.name2} stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Sortable Comparison Table */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl flex flex-col">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-zinc-400" />
                Full Department Metrics Comparison
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Click column headers to sort raw operational and financial metrics
              </p>
            </div>

            <div className="overflow-x-auto flex-1 max-h-[360px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-zinc-950 z-10">
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase">
                    <th onClick={() => toggleSort('department_name')} className="py-2.5 px-2.5 cursor-pointer hover:bg-zinc-800">
                      <div className="flex items-center gap-1">Dept <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('compositeScore')} className="py-2.5 px-2 cursor-pointer hover:bg-zinc-800 text-right">
                      <div className="flex items-center justify-end gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('marginPct')} className="py-2.5 px-2 cursor-pointer hover:bg-zinc-800 text-right">
                      <div className="flex items-center justify-end gap-1">Margin % <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('occupancyPct')} className="py-2.5 px-2 cursor-pointer hover:bg-zinc-800 text-right">
                      <div className="flex items-center justify-end gap-1">Occ % <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('satisfaction')} className="py-2.5 px-2 cursor-pointer hover:bg-zinc-800 text-right">
                      <div className="flex items-center justify-end gap-1">Sat <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium text-zinc-300">
                  {sortedTableData.map((row) => (
                    <tr key={row.dept_id} className="hover:bg-zinc-800/40">
                      <td className="py-2.5 px-2.5 font-bold text-white">{row.department_name}</td>
                      <td className="py-2.5 px-2 text-right font-bold font-mono text-blue-400">{row.compositeScore}</td>
                      <td className={`py-2.5 px-2 text-right font-mono ${row.marginPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercent(row.marginPct, true)}
                      </td>
                      <td className="py-2.5 px-2 text-right">{row.occupancyPct}%</td>
                      <td className="py-2.5 px-2 text-right">{row.satisfaction}</td>
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

export default function DepartmentPerformancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Department Performance...</div>}>
      <DepartmentPerformanceContent />
    </Suspense>
  );
}
