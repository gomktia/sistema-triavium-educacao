'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { LayoutDashboard } from 'lucide-react';

interface ClassroomRow {
  id: string;
  name: string;
  grade: string;
  totalStudents: number;
  tier1: number;
  tier2: number;
  tier3: number;
  completionRate: number;
}

interface ClassroomHeatmapProps {
  classrooms: ClassroomRow[];
  onWindowChange: (window: string) => void;
  currentWindow: string;
}

const GRADE_LABELS: Record<string, string> = {
  ANO_1_EM: '1ª Série',
  ANO_2_EM: '2ª Série',
  ANO_3_EM: '3ª Série',
};

const WINDOW_OPTIONS = [
  { value: 'DIAGNOSTIC', label: 'Diagnóstica' },
  { value: 'MONITORING', label: 'Monitoramento' },
  { value: 'FINAL', label: 'Final' },
];

function getCellColor(value: number, type: 'tier1' | 'tier2' | 'tier3' | 'completion') {
  if (type === 'tier1') return value >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-600';
  if (type === 'tier2') return value >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600';
  if (type === 'tier3') return value >= 10 ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-600';
  if (type === 'completion') {
    if (value === 100) return 'bg-emerald-100 text-emerald-700';
    if (value >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }
  return 'bg-slate-50 text-slate-600';
}

export function ClassroomHeatmap({ classrooms, onWindowChange, currentWindow }: ClassroomHeatmapProps) {
  if (classrooms.length === 0) {
    return (
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardContent className="py-16 text-center">
          <LayoutDashboard className="mx-auto text-slate-200 mb-4" size={48} strokeWidth={1.5} />
          <p className="text-slate-400 font-bold">Nenhuma turma encontrada</p>
          <p className="text-slate-400 text-sm mt-1">
            Cadastre turmas e alunos para visualizar o comparativo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = classrooms.map((c) => {
    const assessed = c.tier1 + c.tier2 + c.tier3;
    return {
      name: c.name,
      'Camada 1': assessed > 0 ? c.tier1 : 0,
      'Camada 2': assessed > 0 ? c.tier2 : 0,
      'Camada 3': assessed > 0 ? c.tier3 : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Janela de Triagem:
        </label>
        <select
          value={currentWindow}
          onChange={(e) => onWindowChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {WINDOW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Heatmap Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">
            Distribuição de Risco por Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Turma</th>
                  <th className="text-center py-3 px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Total</th>
                  <th className="text-center py-3 px-4 text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Camada 1 (%)</th>
                  <th className="text-center py-3 px-4 text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">Camada 2 (%)</th>
                  <th className="text-center py-3 px-4 text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Camada 3 (%)</th>
                  <th className="text-center py-3 px-4 text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Adesão (%)</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((c) => {
                  const assessed = c.tier1 + c.tier2 + c.tier3;
                  const t1Pct = assessed > 0 ? Math.round((c.tier1 / assessed) * 100) : 0;
                  const t2Pct = assessed > 0 ? Math.round((c.tier2 / assessed) * 100) : 0;
                  const t3Pct = assessed > 0 ? Math.round((c.tier3 / assessed) * 100) : 0;

                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">
                          {GRADE_LABELS[c.grade] || c.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{c.totalStudents}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${getCellColor(t1Pct, 'tier1')}`}>
                          {t1Pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${getCellColor(t2Pct, 'tier2')}`}>
                          {t2Pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${getCellColor(t3Pct, 'tier3')}`}>
                          {t3Pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${getCellColor(c.completionRate, 'completion')}`}>
                          {c.completionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stacked Bar Chart */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">
            Gráfico Comparativo por Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="gradTier1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="gradTier2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="gradTier3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
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
                  dataKey="Camada 1"
                  stackId="a"
                  fill="url(#gradTier1)"
                  radius={[0, 0, 0, 0]}
                  barSize={48}
                />
                <Bar
                  dataKey="Camada 2"
                  stackId="a"
                  fill="url(#gradTier2)"
                  radius={[0, 0, 0, 0]}
                  barSize={48}
                />
                <Bar
                  dataKey="Camada 3"
                  stackId="a"
                  fill="url(#gradTier3)"
                  radius={[8, 8, 0, 0]}
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
