import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, FamilySocioemotionalResult } from '@/src/core/types';
import { FamilySocioemotionalResultView } from '@/components/family-socioemotional/FamilySocioemotionalResultView';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Resultados — Percepção Familiar | Portal do Responsável',
};

export default async function PercepcaoFamiliarResultadoPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.RESPONSIBLE) {
        redirect('/');
    }

    const guardianLink = await prisma.studentGuardian.findFirst({
        where: { guardianId: user.id, tenantId: user.tenantId },
        include: {
            student: {
                select: { id: true, name: true },
            },
        },
    });

    if (!guardianLink) {
        redirect('/responsavel');
    }

    const student = guardianLink.student;

    // Fetch completed assessment
    const assessment = await prisma.assessment.findFirst({
        where: {
            studentId: student.id,
            type: 'FAMILY_SOCIOEMOTIONAL',
            screeningTeacherId: null,
        },
        orderBy: { appliedAt: 'desc' },
        select: { processedScores: true },
    });

    if (!assessment?.processedScores) {
        redirect('/responsavel/percepcao-familiar');
    }

    const result = assessment.processedScores as unknown as FamilySocioemotionalResult;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/responsavel">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Percepção Familiar
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Inventário de Relato Familiar — {student.name}
                    </p>
                </div>
            </div>

            <FamilySocioemotionalResultView result={result} showInterventions={false} />
        </div>
    );
}
