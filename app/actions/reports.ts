'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getLabels } from '@/src/lib/utils/labels';
import { UserRole } from '@/src/core/types';
import * as XLSX from 'xlsx';
import { calculateTierMigration, calculateGroupEfficacy } from '@/lib/intervention-monitoring';

export async function generateExcelReport() {
    const user = await getCurrentUser();
    if (!user) return { error: 'Não autorizado' };

    const labels = getLabels(user.organizationType);

    // 1. Fetch Students with their latest data
    const students = await prisma.student.findMany({
        where: {
            tenantId: user.tenantId,
            isActive: true,
        },
        include: {
            classroom: true,
            assessments: {
                where: {
                    type: { in: ['SRSS_IE', 'VIA_STRENGTHS'] },
                    // Get latest
                },
                orderBy: { appliedAt: 'desc' },
            },
            schoolIndicators: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { name: 'asc' }
    });

    // 2. Transform Data
    const data = students.map(student => {
        // Find latest SRSS-IE
        const srss = student.assessments.find(a => a.type === 'SRSS_IE');
        const via = student.assessments.find(a => a.type === 'VIA_STRENGTHS');
        const indicators = student.schoolIndicators[0];

        // Process Strengths
        let strengths = '';
        if (via && via.processedScores) {
            const scores = via.processedScores as any;
            if (scores.signatureTop5 && Array.isArray(scores.signatureTop5)) {
                strengths = scores.signatureTop5.map((s: any) => s.strength).join(', ');
            }
        }

        return {
            [labels.subject]: student.name,
            'Turma': student.classroom?.name || 'N/A',
            'Nível de Risco': srss?.overallTier?.replace('TIER_', 'Nível ') || 'Não avaliado',
            [`% Faltas`]: indicators ? `${indicators.attendanceRate}%` : 'N/A',
            'Forças de Assinatura': strengths || 'Pendente',
            // Add a status column for better readability
            'Status': srss?.overallTier === 'TIER_3' ? 'CRÍTICO' :
                srss?.overallTier === 'TIER_2' ? 'ATENÇÃO' :
                    srss?.overallTier === 'TIER_1' ? 'NORMAL' : 'PENDENTE'
        };
    });

    // 3. Create Workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Relatório ${labels.subjects}`);

    // 4. Generate Buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 5. Return Base64
    return {
        success: true,
        base64: buf.toString('base64'),
        filename: `relatorio_${labels.subjects.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    };
}

export async function getRiskEvolutionData() {
    const user = await getCurrentUser();
    if (!user) return [];

    const windows = ['DIAGNOSTIC', 'MONITORING', 'FINAL'];
    const windowLabels: Record<string, string> = {
        'DIAGNOSTIC': 'Março',
        'MONITORING': 'Junho',
        'FINAL': 'Outubro'
    };

    // We need to count tiers for each window
    // Since we store all assessments, we can group by window and tier

    const assessments = await prisma.assessment.groupBy({
        by: ['screeningWindow', 'overallTier'],
        where: {
            tenantId: user.tenantId,
            type: 'SRSS_IE',
            academicYear: new Date().getFullYear(),
            overallTier: { not: null }
        },
        _count: {
            overallTier: true
        }
    });

    // Process into chart format
    // [{ name: 'Março', Tier1: 10, Tier2: 5, Tier3: 2 }, ...]

    return windows.map(w => {
        const tier1 = assessments.find(a => a.screeningWindow === w && a.overallTier === 'TIER_1')?._count.overallTier || 0;
        const tier2 = assessments.find(a => a.screeningWindow === w && a.overallTier === 'TIER_2')?._count.overallTier || 0;
        const tier3 = assessments.find(a => a.screeningWindow === w && a.overallTier === 'TIER_3')?._count.overallTier || 0;

        // Only return if there is data for this window (optional, but good for cleanliness)
        // Or return all windows to show progression even if empty (0)
        return {
            name: windowLabels[w],
            'Baixo Risco': tier1,
            'Risco Moderado': tier2,
            'Alto Risco': tier3
        };
    });
}

/**
 * Obtém os dados completos do aluno para o relatório.
 */
export async function getStudentForReport(studentId: string) {
    const user = await getCurrentUser();
    const allowedRoles = [UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN];

    if (!user || !allowedRoles.includes(user.role)) return null;

    const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId: user.tenantId },
        include: {
            classroom: true,
            assessments: {
                where: { type: { in: ['SRSS_IE', 'VIA_STRENGTHS'] } },
                orderBy: { appliedAt: 'desc' },
                include: { screeningTeacher: true }
            },
            schoolIndicators: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    return student;
}

/**
 * Gera um texto rascunho para o laudo com base na inteligência do sistema.
 */
export async function generateDraftOpinion(student: any) {
    const labels = getLabels(student.tenant?.organizationType);
    const isEducational = student.tenant?.organizationType === 'EDUCATIONAL';

    // Find latest SRSS
    const srss = student.assessments.find((a: any) => a.type === 'SRSS_IE');
    const via = student.assessments.find((a: any) => a.type === 'VIA_STRENGTHS');
    const indicator = student.schoolIndicators[0];

    const riskLevel = srss?.overallTier === 'TIER_3' ? 'Alto Risco' :
        srss?.overallTier === 'TIER_2' ? 'Risco Moderado' : 'Baixo Risco';

    let strengthsText = 'ainda não foram mapeadas';
    if (via && via.processedScores) {
        const scores = via.processedScores as any;
        if (scores.signatureTop5) {
            strengthsText = scores.signatureTop5.map((s: any) => s.strength).join(', ');
        }
    }

    const attendanceText = indicator ?
        `apresenta uma taxa de frequência de ${indicator.attendanceRate}%, o que ${indicator.attendanceRate < 85 ? 'requer atenção' : 'é satisfatório'}` :
        'não possui dados recentes de frequência';

    let bnccContext = '';
    if (isEducational) {
        bnccContext = `
Em consonância com as Competências Gerais da BNCC, especificamente a Competência 8 (Autoconhecimento e Autocuidado) e 9 (Empatia e Cooperação), observamos que o aluno demonstra potencial para desenvolver maior resiliência emocional e habilidades de convivência.
        `.trim();
    }

    const draft = `
PARECER TÉCNICO SOCIOEMOCIONAL

1. ANÁLISE DE PERFIL
O ${labels.subject.toLowerCase()} ${student.name}, matriculado na turma ${student.classroom?.name || 'Não informada'}, foi avaliado no contexto do Programa de Desenvolvimento Socioemocional. Atualmente, encontra-se classificado no nível de ${riskLevel} para comportamentos internalizantes e externalizantes.

2. PONTOS FORTES
Através da avaliação VIA de Forças de Caráter, identificamos que as forças de assinatura do ${labels.subject.toLowerCase()} são: ${strengthsText}. Estas forças representam recursos internos valiosos que podem ser alavancados para mitigar riscos identificados.

3. INDICADORES ESCOLARES
No que tange ao desempenho acadêmico e comportamental, o ${labels.subject.toLowerCase()} ${attendanceText}.

${isEducational ? '4. CONTEXTO PEDAGÓGICO (BNCC)\n' + bnccContext + '\n\n' : ''}5. RECOMENDAÇÕES E ENCAMINHAMENTOS
Considerando a análise integrada dos dados, recomenda-se a continuidade do monitoramento e a inclusão do ${labels.subject.toLowerCase()} em grupos focais voltados para Regulação Emocional e Habilidades Sociais. É fundamental o envolvimento da família para reforçar as estratégias trabalhadas no ambiente ${labels.organization.toLowerCase()}.

Este parecer é confidencial e deve ser utilizado exclusivamente para fins pedagógicos e de suporte ao desenvolvimento do ${labels.subject.toLowerCase()}.
`.trim();

    return draft;
}

/**
 * Salva o parecer no histórico de intervenções.
 */
export async function saveProfessionalOpinion(studentId: string, text: string) {
    const user = await getCurrentUser();
    if (!user) return { error: 'Não autorizado.' };

    try {
        // Encontrar tier atual
        const assessment = await prisma.assessment.findFirst({
            where: {
                tenantId: user.tenantId,
                studentId,
                type: 'SRSS_IE',
                academicYear: new Date().getFullYear()
            },
            orderBy: { appliedAt: 'desc' }
        });

        const tier = assessment?.overallTier || 'TIER_1';

        await prisma.interventionLog.create({
            data: {
                tenantId: user.tenantId,
                studentId,
                authorId: user.id,
                type: 'INDIVIDUAL_PLAN',
                status: 'COMPLETED',
                tier,
                title: 'Emissão de Laudo Técnico',
                description: text,
                observations: 'Laudo gerado via sistema.',
                startDate: new Date(),
            }
        });

        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Erro ao salvar histórico.' };
    }
}

/**
 * Obtém dados consolidados para o painel de monitoramento de intervenções.
 * Acesso restrito a MANAGER e ADMIN.
 */
export async function getInterventionMonitoringData(): Promise<{
    kpis: {
        totalTier3: number;
        migrationPositivePercent: number;
        migrationNegativePercent: number;
        activeGroups: number;
    };
    tierMigration: {
        label: string;
        improved: number;
        unchanged: number;
        worsened: number;
    }[];
    groupEfficacy: {
        id: string;
        name: string;
        type: string;
        studentCount: number;
        percentImproved: number;
        percentUnchanged: number;
        percentWorsened: number;
    }[];
} | null> {
    const user = await getCurrentUser();
    if (!user || (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN)) {
        return null;
    }

    const academicYear = new Date().getFullYear();

    // 1. Fetch all SRSS-IE assessments for the current academic year with a tier
    const assessments = await prisma.assessment.findMany({
        where: {
            tenantId: user.tenantId,
            type: 'SRSS_IE',
            academicYear,
            overallTier: { not: null },
        },
        select: {
            studentId: true,
            screeningWindow: true,
            overallTier: true,
            appliedAt: true,
        },
        orderBy: { appliedAt: 'desc' },
    });

    // 2. Deduplicate: keep only the latest assessment per student+window
    const seen = new Set<string>();
    const unique = assessments.filter((a) => {
        const key = `${a.studentId}-${a.screeningWindow}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // 3. Group by screening window
    const byWindow: Record<string, { studentId: string; tier: string }[]> = {
        DIAGNOSTIC: [],
        MONITORING: [],
        FINAL: [],
    };

    for (const a of unique) {
        const window = a.screeningWindow as string;
        if (byWindow[window]) {
            byWindow[window].push({ studentId: a.studentId, tier: a.overallTier as string });
        }
    }

    // 4. Calculate tier migration between consecutive windows
    const windowPairs: { before: string; after: string; label: string }[] = [
        { before: 'DIAGNOSTIC', after: 'MONITORING', label: 'Mar → Jun' },
        { before: 'MONITORING', after: 'FINAL', label: 'Jun → Out' },
    ];

    const tierMigration = windowPairs
        .filter((pair) => byWindow[pair.before].length > 0 && byWindow[pair.after].length > 0)
        .map((pair) => {
            const result = calculateTierMigration(byWindow[pair.before], byWindow[pair.after]);
            return {
                label: pair.label,
                improved: result.improved,
                unchanged: result.unchanged,
                worsened: result.worsened,
            };
        });

    // 5. Calculate KPIs
    // Determine the most recent window with data (order: FINAL > MONITORING > DIAGNOSTIC)
    const windowOrder = ['FINAL', 'MONITORING', 'DIAGNOSTIC'] as const;
    const mostRecentWindow = windowOrder.find((w) => byWindow[w].length > 0);
    const earliestWindow = [...windowOrder].reverse().find((w) => byWindow[w].length > 0);

    const totalTier3 = mostRecentWindow
        ? byWindow[mostRecentWindow].filter((e) => e.tier === 'TIER_3').length
        : 0;

    // Overall migration: earliest window → most recent window
    let migrationPositivePercent = 0;
    let migrationNegativePercent = 0;

    if (earliestWindow && mostRecentWindow && earliestWindow !== mostRecentWindow) {
        const overall = calculateTierMigration(byWindow[earliestWindow], byWindow[mostRecentWindow]);
        if (overall.total > 0) {
            migrationPositivePercent = Math.round((overall.improved / overall.total) * 100);
            migrationNegativePercent = Math.round((overall.worsened / overall.total) * 100);
        }
    }

    // Count active intervention groups for this tenant
    const activeGroups = await prisma.interventionGroup.count({
        where: { tenantId: user.tenantId, isActive: true },
    });

    // 6. Calculate group efficacy
    const groups = await prisma.interventionGroup.findMany({
        where: { tenantId: user.tenantId, isActive: true },
        include: {
            students: {
                select: { id: true },
            },
        },
    });

    // Collect all student IDs across all groups for a single query
    const allGroupStudentIds = new Set<string>();
    for (const group of groups) {
        for (const s of group.students) {
            allGroupStudentIds.add(s.id);
        }
    }

    // Single query for all group students' assessments (avoids N+1)
    const groupAssessments = allGroupStudentIds.size > 0
        ? await prisma.assessment.findMany({
            where: {
                tenantId: user.tenantId,
                studentId: { in: [...allGroupStudentIds] },
                type: 'SRSS_IE',
                academicYear,
                overallTier: { not: null },
            },
            select: {
                studentId: true,
                overallTier: true,
                appliedAt: true,
            },
            orderBy: { appliedAt: 'asc' },
        })
        : [];

    // Build earliest and latest tier maps for all students at once
    const allEarliestTier = new Map<string, string>();
    const allLatestTier = new Map<string, string>();

    for (const sa of groupAssessments) {
        if (!allEarliestTier.has(sa.studentId)) {
            allEarliestTier.set(sa.studentId, sa.overallTier as string);
        }
        allLatestTier.set(sa.studentId, sa.overallTier as string);
    }

    const groupEfficacy = groups.map((group) => {
        const studentIds = group.students.map((s) => s.id);

        const entries = studentIds
            .filter((id) => allEarliestTier.has(id) && allLatestTier.has(id))
            .map((id) => ({
                studentId: id,
                tierBefore: allEarliestTier.get(id)!,
                tierAfter: allLatestTier.get(id)!,
            }));

        const efficacy = calculateGroupEfficacy(entries);

        return {
            id: group.id,
            name: group.name,
            type: group.type,
            studentCount: studentIds.length,
            percentImproved: efficacy.percentImproved,
            percentUnchanged: efficacy.percentUnchanged,
            percentWorsened: efficacy.percentWorsened,
        };
    });

    return {
        kpis: {
            totalTier3,
            migrationPositivePercent,
            migrationNegativePercent,
            activeGroups,
        },
        tierMigration,
        groupEfficacy,
    };
}
