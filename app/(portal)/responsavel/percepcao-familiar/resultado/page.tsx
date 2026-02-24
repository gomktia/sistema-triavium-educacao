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

interface PageProps {
    searchParams: Promise<{ filho?: string }>;
}

export default async function PercepcaoFamiliarResultadoPage({ searchParams }: PageProps) {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.RESPONSIBLE) {
        redirect('/');
    }

    const params = await searchParams;

    // Fetch linked children and resolve selected child
    const guardianLinks = await prisma.studentGuardian.findMany({
        where: { guardianId: user.id, tenantId: user.tenantId },
        include: {
            student: {
                select: { id: true, name: true },
            },
        },
    });

    if (guardianLinks.length === 0) {
        redirect('/responsavel');
    }

    const selectedLink = params.filho
        ? guardianLinks.find(l => l.student.id === params.filho) ?? guardianLinks[0]
        : guardianLinks[0];
    const student = selectedLink.student;

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
        redirect(`/responsavel/percepcao-familiar?filho=${student.id}`);
    }

    const result = assessment.processedScores as unknown as FamilySocioemotionalResult;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/responsavel?filho=${student.id}`}>
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
