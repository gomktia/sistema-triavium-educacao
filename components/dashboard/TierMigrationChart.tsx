'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TierMigrationChartProps {
  data: {
    label: string;
    improved: number;
    unchanged: number;
    worsened: number;
  }[];
}

export function TierMigrationChart({ data }: TierMigrationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm font-medium">
        Dados insuficientes. Necessárias ao menos 2 janelas de triagem.
      </div>
    );
  }

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradImproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="gradUnchanged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
              <stop offset="100%" stopColor="#64748b" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="gradWorsened" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
            cursor={{ fill: '#f8fafc', radius: 8 }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}
          />
          <Bar
            dataKey="improved"
            name="Melhorou"
            fill="url(#gradImproved)"
            radius={[8, 8, 0, 0]}
            barSize={48}
          />
          <Bar
            dataKey="unchanged"
            name="Manteve"
            fill="url(#gradUnchanged)"
            radius={[8, 8, 0, 0]}
            barSize={48}
          />
          <Bar
            dataKey="worsened"
            name="Piorou"
            fill="url(#gradWorsened)"
            radius={[8, 8, 0, 0]}
            barSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
