import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/src/core/types';
import { QuestionnaireWizard } from '@/components/questionnaire/QuestionnaireWizard';
import { VIARawAnswers } from '@/src/core/types';

export const metadata = {
    title: 'Questionário Socioemocional | VIA',
};

export default async function QuestionarioPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.STUDENT) {
        redirect('/');
    }

    if (!user.studentId) {
        return (
            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl">
                <p className="text-rose-600 font-bold">Erro: Sua conta de aluno não está vinculada a um registro de matrícula.</p>
                <p className="text-slate-500 text-sm mt-2">Por favor, contate o administrador do sistema.</p>
            </div>
        );
    }

    const assessment = await prisma.assessment.findFirst({
        where: {
            tenantId: user.tenantId,
            studentId: user.studentId!,
            type: 'VIA_STRENGTHS',
        },
        select: { rawAnswers: true, processedScores: true },
        orderBy: { appliedAt: 'desc' },
    });

    if (assessment?.processedScores) {
        redirect('/minhas-forcas');
    }

    const initialAnswers = (assessment?.rawAnswers as VIARawAnswers) || {};

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Mapeamento de Forças</h1>
                <p className="text-slate-500">Este questionário nos ajudará a entender seus talentos e pontos fortes.</p>
            </div>

            <QuestionnaireWizard initialAnswers={initialAnswers} />
        </div>
    );
}
