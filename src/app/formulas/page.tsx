'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Calculator,
  IndianRupee,
  Activity,
  HeartPulse,
  Award,
  BrainCircuit,
  Info,
  CheckCircle2,
  Code2,
} from 'lucide-react';

function FormulasContent() {
  const formulaCategories = [
    {
      title: 'Financial Analytics Formulas',
      icon: IndianRupee,
      color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
      formulas: [
        {
          name: 'Net Profit / Loss',
          description: 'Calculates net monetary gain or loss for the selected department and period.',
          math: 'Net Profit = SUM(billed_revenue) - SUM(service_cost)',
          sql: 'SELECT SUM(billed_revenue) - SUM(service_cost) AS net_profit FROM fact_financials;',
          notes: 'Color coded green if ≥ ₹0.00, red if < ₹0.00.',
        },
        {
          name: 'Overall Institutional ROI %',
          description: 'Measures net financial return generated relative to total allocated budget base.',
          math: 'Overall ROI % = [ (SUM(billed_revenue) - SUM(service_cost)) / SUM(allocated_budget) ] * 100',
          sql: 'SELECT ((SUM(f.billed_revenue) - SUM(f.service_cost)) / SUM(d.allocated_budget)) * 100 FROM fact_financials f JOIN dim_department d ON f.dept_id = d.dept_id;',
          notes: 'Evaluated across selected departments in the active filter scope.',
        },
        {
          name: 'Net Margin %',
          description: 'Percentage of billed revenue retained as net profit after deducting service costs.',
          math: 'Net Margin % = [ (Billed Revenue - Service Cost) / Billed Revenue ] * 100',
          sql: 'SELECT ((SUM(billed_revenue) - SUM(service_cost)) / SUM(billed_revenue)) * 100 FROM fact_financials;',
          notes: 'Used to sort department tables worst-margin-first to isolate financial leakages.',
        },
        {
          name: 'Cost per Patient Encounter',
          description: 'Average direct operational expenditure incurred per completed clinical encounter.',
          math: 'Cost per Patient = SUM(fact_financials.service_cost) / COUNT(fact_operational_clinical.encounter_id)',
          sql: 'SELECT SUM(f.service_cost) / COUNT(DISTINCT o.encounter_id) FROM fact_financials f JOIN fact_operational_clinical o ON f.dept_id = o.dept_id;',
          notes: 'Expressed in Indian Rupee format (₹).',
        },
      ],
    },
    {
      title: 'Operational Analytics Formulas',
      icon: Activity,
      color: 'text-blue-400 bg-blue-950/80 border-blue-800/80',
      formulas: [
        {
          name: 'Bed Occupancy Rate %',
          description: 'Percentage of available inpatient beds actively occupied during patient encounters.',
          math: 'Bed Occupancy Rate % = [ COUNT(bed_occupied = 1) / Total Encounters ] * 100',
          sql: 'SELECT (SUM(bed_occupied) * 100.0 / COUNT(encounter_id)) AS occupancy_rate FROM fact_operational_clinical;',
          notes: 'Aggregated monthly to plot capacity utilization trend lines.',
        },
        {
          name: 'Average Length of Stay (ALOS)',
          description: 'Average duration in days between patient admission and discharge dates.',
          math: 'ALOS (days) = AVG(discharge_date - admission_date)',
          sql: 'SELECT AVG(discharge_date - admission_date) AS alos FROM fact_operational_clinical;',
          notes: 'Lower ALOS indicates higher bed turnaround efficiency.',
        },
        {
          name: '30-Day Readmission Rate %',
          description: 'Percentage of discharged patients who required unplanned readmission within 30 days.',
          math: 'Readmission Rate % = [ COUNT(readmitted_30d = 1) / Total Encounters ] * 100',
          sql: 'SELECT (SUM(readmitted_30d) * 100.0 / COUNT(encounter_id)) FROM fact_operational_clinical;',
          notes: 'High readmission rates reflect quality issues or post-discharge gaps.',
        },
      ],
    },
    {
      title: 'Clinical & Quality Formulas',
      icon: HeartPulse,
      color: 'text-amber-400 bg-amber-950/80 border-amber-800/80',
      formulas: [
        {
          name: 'Average Patient Satisfaction Score',
          description: 'Mean post-discharge satisfaction survey score rated on a 1-10 scale.',
          math: 'Avg Satisfaction = SUM(satisfaction_score) / Total Survey Responses',
          sql: 'SELECT AVG(satisfaction_score) FROM fact_operational_clinical WHERE satisfaction_score IS NOT NULL;',
          notes: 'Display scale out of 10.0.',
        },
        {
          name: 'Patient Risk Profile Volume',
          description: 'Encounter volume count grouped by clinical risk category (Low, Medium, High).',
          math: 'Risk Count = COUNT(encounter_id) GROUP BY dim_patient.risk_category',
          sql: 'SELECT p.risk_category, COUNT(o.encounter_id) FROM fact_operational_clinical o JOIN dim_patient p ON o.patient_id = p.patient_id GROUP BY p.risk_category;',
          notes: 'Presented as stacked bar charts for clinical resource allocation.',
        },
      ],
    },
    {
      title: 'Department Composite Score (0-100)',
      icon: Award,
      color: 'text-purple-400 bg-purple-950/80 border-purple-800/80',
      formulas: [
        {
          name: 'Composite Institutional Score Weighting',
          description: 'Client-side normalized score combining 4 vital operational dimensions into a 0-100 scale.',
          math: 'Composite Score = (0.30 * FinScore) + (0.30 * OpScore) + (0.20 * ClinScore) + (0.20 * WarnScore)',
          sql: '-- Client-side composite formula:\n-- FinScore = (Margin% + 10) * 3.33 (normalized 0-100)\n-- OpScore = Occupancy% * 0.7 + (15 - ALOS) * 2\n-- ClinScore = Satisfaction * 8 + (25 - Readmission%) * 0.8\n-- WarnScore = (100 - Early_Warning_Score)',
          notes: 'Ranked best-to-worst (70+ = Top Performer, <50 = Needs Support).',
        },
      ],
    },
    {
      title: 'Predictive & Forecasting Metrics',
      icon: BrainCircuit,
      color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/80',
      formulas: [
        {
          name: 'Forecast Patient Volume & Operational Cost',
          description: 'Canonical precomputed time series predictions pulled directly from fact_forecast_metrics.',
          math: 'Forecast Trajectory = fact_forecast_metrics.predicted_patient_volume & predicted_operational_cost',
          sql: 'SELECT forecast_date, predicted_patient_volume, predicted_operational_cost FROM fact_forecast_metrics WHERE dept_id = :dept ORDER BY forecast_date;',
          notes: 'Rendered as dashed continuation lines from solid historical actuals.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      {/* Header Banner (Without Filters) */}
      <section className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-16 z-30 shadow-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Analytical Formulas & Methodology Reference
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Complete mathematical equations, SQL queries, composite weightings, and business logic
          </p>
        </div>
      </section>

      <main className="p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
        
        {/* Banner Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-6 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Aarogya Analytics Quantitative Methodology
            </h3>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              Transparency is paramount in institutional healthcare governance. This reference guide outlines the exact mathematical definitions, database column derivations, and weighting parameters used across all 6 analytics modules.
            </p>
          </div>
        </div>

        {/* Formulas Grid Categories */}
        <div className="space-y-8">
          {formulaCategories.map((category, catIdx) => {
            const Icon = category.icon;
            return (
              <div key={catIdx} className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                  <div className={`p-2.5 rounded-lg border ${category.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {category.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.formulas.map((item, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-zinc-950 border border-zinc-800/80 rounded-[12px] p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium">{item.description}</p>
                      </div>

                      {/* Mathematical Equation Block */}
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 font-mono text-xs font-bold text-zinc-200 break-words shadow-2xs">
                        <span className="text-[10px] uppercase font-sans tracking-wider text-zinc-500 block mb-1 font-semibold">
                          Mathematical Equation:
                        </span>
                        {item.math}
                      </div>

                      {/* SQL Query Block */}
                      <div className="bg-black/80 text-emerald-400 p-3 rounded-lg border border-zinc-900 font-mono text-[11px] break-words">
                        <span className="text-[10px] uppercase font-sans tracking-wider text-zinc-500 block mb-1 font-semibold flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-zinc-500" /> SQL Aggregation:
                        </span>
                        {item.sql}
                      </div>

                      <div className="text-[11px] text-zinc-400 font-medium italic pt-1 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{item.notes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function FormulasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading Formulas Reference...</div>}>
      <FormulasContent />
    </Suspense>
  );
}
