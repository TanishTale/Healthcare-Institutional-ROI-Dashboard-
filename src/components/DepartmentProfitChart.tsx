'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { formatINR, formatCompactINR } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export interface DepartmentProfitItem {
  dept_id: string;
  department_name: string;
  billed_revenue: number;
  service_cost: number;
  netProfit: number;
}

interface DepartmentProfitChartProps {
  data: DepartmentProfitItem[];
  loading?: boolean;
}

export default function DepartmentProfitChart({
  data,
  loading = false,
}: DepartmentProfitChartProps) {
  // Sort departments by netProfit descending (highest profitability to highest loss)
  const sortedData = [...data].sort((a, b) => b.netProfit - a.netProfit);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-[12px] p-6 h-[380px] animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-zinc-800 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[12px] p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
            Profit / Loss by Department
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Departments ranked from highest profitability to highest financial loss
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-zinc-300">Profitable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
            <span className="text-zinc-300">Loss</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{ top: 10, right: 90, left: 40, bottom: 10 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => formatCompactINR(value)}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              axisLine={{ stroke: '#27272a' }}
              tickLine={{ stroke: '#27272a' }}
            />
            <YAxis
              dataKey="department_name"
              type="category"
              tick={{ fontSize: 12, fill: '#fafafa', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DepartmentProfitItem;
                  const isProfit = item.netProfit >= 0;
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                      <p className="font-bold text-white text-sm">{item.department_name}</p>
                      <div className="border-t border-zinc-800 pt-1.5 space-y-1 text-zinc-300">
                        <p className="flex justify-between gap-4">
                          <span className="text-zinc-400">Billed Revenue:</span>
                          <span className="font-mono text-white">{formatINR(item.billed_revenue)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-zinc-400 font-medium">Service Cost:</span>
                          <span className="font-mono text-zinc-300">{formatINR(item.service_cost)}</span>
                        </p>
                        <p className="flex justify-between gap-4 font-bold pt-1 border-t border-zinc-800/60">
                          <span className="text-zinc-300">Net Profit / Loss:</span>
                          <span className={`font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatINR(item.netProfit)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="netProfit" radius={[0, 4, 4, 0]} barSize={22}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.netProfit >= 0 ? '#10b981' : '#f43f5e'}
                />
              ))}
              <LabelList
                dataKey="netProfit"
                position="right"
                formatter={(val: any) => formatINR(Number(val))}
                style={{ fontSize: 11, fontWeight: 700, fill: '#fafafa', fontFamily: 'monospace' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
