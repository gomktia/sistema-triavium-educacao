'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ClassroomCompletion {
  id: string;
  name: string;
  total: number;
  completed: number;
  pct: number;
}

interface ScreeningWindowData {
  window: string;
  label: string;
  classrooms: ClassroomCompletion[];
}

interface ScreeningTimelineProps {
  windows: ScreeningWindowData[];
}

function getProgressColor(pct: number) {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  if (pct > 0) return 'bg-red-500';
  return 'bg-slate-300';
}

function getProgressBg(pct: number) {
  if (pct === 100) return 'bg-emerald-100';
  if (pct >= 50) return 'bg-amber-100';
  if (pct > 0) return 'bg-red-100';
  return 'bg-slate-100';
}

function getStatusIcon(pct: number) {
  if (pct === 100) return <CheckCircle2 className="text-emerald-500" size={16} />;
  if (pct >= 50) return <Clock className="text-amber-500" size={16} />;
  if (pct > 0) return <AlertCircle className="text-red-500" size={16} />;
  return <Clock className="text-slate-400" size={16} />;
}

export function ScreeningTimeline({ windows }: ScreeningTimelineProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {windows.map((w) => {
        const completedClassrooms = w.classrooms.filter((c) => c.pct === 100).length;
        const totalClassrooms = w.classrooms.length;

        return (
          <Card key={w.window} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black text-slate-900 tracking-tight">
                {w.label}
              </CardTitle>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                {completedClassrooms} de {totalClassrooms} turmas completas
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {w.classrooms.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Nenhuma turma cadastrada
                </p>
              ) : (
                w.classrooms.map((c) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(c.pct)}
                        <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {c.completed}/{c.total} ({c.pct}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${getProgressBg(c.pct)}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(c.pct)}`}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
