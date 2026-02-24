import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/src/core/types';
import { getFamilyMessages } from '@/app/actions/family-communication';
import { FamilyMessageList } from '@/components/guardian/FamilyMessageList';
import { MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MensagensPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.RESPONSIBLE) {
    redirect('/');
  }

  const result = await getFamilyMessages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare size={24} className="text-indigo-500" />
          Mensagens
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Mensagens enviadas pela escola sobre seu(sua) filho(a)
        </p>
      </div>

      <FamilyMessageList messages={result.messages} />
    </div>
  );
}
