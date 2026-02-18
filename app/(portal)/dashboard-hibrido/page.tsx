
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/src/core/types';
import { redirect } from 'next/navigation';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';
import { HybridDashboardView } from '@/components/dashboard/HybridDashboardView';

export const metadata = {
    title: 'Análise Híbrida | Triavium',
};

export default async function HybridDashboardPage() {
    const user = await getCurrentUser();
    const allowedRoles = [UserRole.PSYCHOLOGIST, UserRole.MANAGER, UserRole.ADMIN];

    if (!user || !allowedRoles.includes(user.role)) {
        redirect('/');
    }

    // Fetch all students and their assessments
    const students = await prisma.student.findMany({
        where: { tenantId: user.tenantId },
        select: {
            id: true,
            name: true,
            grade: true,
            assessments: {
                select: {
                    type: true,
                    processedScores: true
                }
            }
        }
    });

    // Process data for analysis
    const analysisData = students.map(student => {
        const bigFive = student.assessments.find(a => a.type === 'BIG_FIVE')?.processedScores as any;
        const srss = student.assessments.find(a => a.type === 'SRSS_IE')?.processedScores as any;

        if (!bigFive || !srss) return null;

        // Big Five Scores
        const stability = bigFive.find((s: any) => s.domain === 'ESTABILIDADE')?.score || 0;
        const conscientiousness = bigFive.find((s: any) => s.domain === 'CONSCIENCIOSIDADE')?.score || 0;
        const agreeableness = bigFive.find((s: any) => s.domain === 'AMABILIDADE')?.score || 0;

        // SRSS Scores
        const internalizing = srss.internalizing?.score || 0;
        const externalizing = srss.externalizing?.score || 0;

        return {
            id: student.id,
            name: student.name,
            stability,         // x-axis candidate
            conscientiousness, // x-axis candidate
            internalizing,     // y-axis candidate
            externalizing,     // y-axis candidate
            riskTier: Math.max(
                srss.internalizing?.tier === 'TIER_3' ? 3 : srss.internalizing?.tier === 'TIER_2' ? 2 : 1,
                srss.externalizing?.tier === 'TIER_3' ? 3 : srss.externalizing?.tier === 'TIER_2' ? 2 : 1
            )
        };
    }).filter(Boolean);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BrainCircuit size={32} className="text-violet-600" />
                        Análise Híbrida de Dados
                    </h1>
                    <p className="text-slate-500 font-medium">Correlação entre Personalidade (Traço) e Risco (Estado).</p>
                </div>
            </div>

            <HybridDashboardView data={analysisData} />
        </div>
    );
}
