import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SDQResult } from '@/src/core/types';
import { SDQResultView } from '@/components/sdq/SDQResultView';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Resultados SDQ | Portal do Responsável',
};

interface PageProps {
    searchParams: Promise<{ filho?: string }>;
}

export default async function ResponsavelSDQResultsPage({ searchParams }: PageProps) {
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

    // Fetch parent SDQ result
    const parentSDQ = await prisma.assessment.findFirst({
        where: {
            studentId: student.id,
            type: 'SDQ',
            screeningTeacherId: null,
        },
        orderBy: { appliedAt: 'desc' },
        select: { processedScores: true },
    });

    if (!parentSDQ?.processedScores) {
        redirect(`/responsavel/sdq?filho=${student.id}`);
    }

    const parentResult = parentSDQ.processedScores as unknown as SDQResult;

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
                        Resultados SDQ
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Questionário de Capacidades e Dificuldades — {student.name}
                    </p>
                </div>
            </div>

            <SDQResultView parentResult={parentResult} />
        </div>
    );
}
