import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/src/core/types';
import { FamilySocioemotionalWizardLazy } from '@/components/family-socioemotional/FamilySocioemotionalWizardLazy';

export const metadata = {
    title: 'Percepção Familiar | Portal do Responsável',
};

export default async function PercepcaoFamiliarPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.RESPONSIBLE) {
        redirect('/');
    }

    // Fetch linked child via StudentGuardian
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

    // Check for existing assessment (partial or complete)
    const existing = await prisma.assessment.findFirst({
        where: {
            studentId: student.id,
            type: 'FAMILY_SOCIOEMOTIONAL',
            screeningTeacherId: null,
        },
        orderBy: { appliedAt: 'desc' },
        select: { rawAnswers: true, processedScores: true },
    });

    // If already complete, redirect to results
    if (existing?.processedScores) {
        redirect('/responsavel/percepcao-familiar/resultado');
    }

    const initialAnswers = (existing?.rawAnswers as Record<number, number>) || {};

    return (
        <FamilySocioemotionalWizardLazy
            initialAnswers={initialAnswers}
            studentId={student.id}
            studentName={student.name}
        />
    );
}
