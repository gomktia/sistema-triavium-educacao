import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/src/core/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GuardianProfilePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.RESPONSIBLE) {
    redirect('/');
  }

  const guardianLinks = await prisma.studentGuardian.findMany({
    where: { guardianId: user.id, tenantId: user.tenantId },
    include: {
      student: { select: { name: true, grade: true } },
    },
  });

  const RELATIONSHIP_LABELS: Record<string, string> = {
    MAE: 'Mãe',
    PAI: 'Pai',
    AVO_A: 'Avô/Avó',
    TIO_A: 'Tio/Tia',
    OUTRO: 'Outro',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meu Perfil</h1>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User size={20} className="text-slate-400" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-slate-400" />
            <span className="text-slate-500">Nome:</span>
            <span className="font-medium text-slate-800">{user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-slate-400" />
            <span className="text-slate-500">E-mail:</span>
            <span className="font-medium text-slate-800">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users size={20} className="text-slate-400" />
            Filhos Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardianLinks.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum aluno vinculado.</p>
          ) : (
            <div className="space-y-3">
              {guardianLinks.map((link) => {
                const gradeDisplay =
                  link.student.grade === 'ANO_1_EM' ? '1\u00AA S\u00E9rie EM' :
                  link.student.grade === 'ANO_2_EM' ? '2\u00AA S\u00E9rie EM' : '3\u00AA S\u00E9rie EM';

                return (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-800">{link.student.name}</p>
                      <p className="text-xs text-slate-500">{gradeDisplay}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      {RELATIONSHIP_LABELS[link.relationship] || link.relationship}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
