'use client';

import { useEffect, useState, useTransition } from 'react';
import { ClassroomHeatmap } from '@/components/dashboard/ClassroomHeatmap';
import { getClassroomComparison, type ClassroomComparisonRow } from '@/app/actions/classroom-comparison';
import { BarChart3, Loader2 } from 'lucide-react';

export default function ComparativoPage() {
  const [classrooms, setClassrooms] = useState<ClassroomComparisonRow[]>([]);
  const [currentWindow, setCurrentWindow] = useState('DIAGNOSTIC');
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const fetchData = (window: string) => {
    startTransition(async () => {
      const result = await getClassroomComparison(window);
      if (result.success) {
        setClassrooms(result.classrooms);
      }
      setLoaded(true);
    });
  };

  useEffect(() => {
    fetchData(currentWindow);
  }, []);

  const handleWindowChange = (window: string) => {
    setCurrentWindow(window);
    fetchData(window);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-indigo-500" />
          Comparativo entre Turmas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize a distribuição de risco e adesão à triagem por turma
        </p>
      </div>

      {!loaded || isPending ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <ClassroomHeatmap
          classrooms={classrooms}
          onWindowChange={handleWindowChange}
          currentWindow={currentWindow}
        />
      )}
    </div>
  );
}
