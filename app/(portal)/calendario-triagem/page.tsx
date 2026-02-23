import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/src/core/types';
import { getScreeningCalendar } from '@/app/actions/screening-calendar';
import { ScreeningTimeline } from '@/components/dashboard/ScreeningTimeline';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CalendarioTriagemPage() {
  const user = await getCurrentUser();
  const allowedRoles = [UserRole.TEACHER, UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN];

  if (!user || !allowedRoles.includes(user.role)) {
    redirect('/');
  }

  const result = await getScreeningCalendar();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Calendar size={24} className="text-indigo-500" />
          Calendário de Triagem
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe o progresso das 3 janelas de triagem por turma
        </p>
      </div>

      <ScreeningTimeline windows={result.windows} />
    </div>
  );
}
