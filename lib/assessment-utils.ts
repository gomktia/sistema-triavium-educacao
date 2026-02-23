import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Parâmetros para a operação de upsert de assessment.
 *
 * - `findByScreeningWindow`: quando true, inclui screeningWindow e academicYear
 *   no critério de busca (findFirst). VIA e SRSS usam true; Big Five e IEAA usam false.
 * - `extraData`: campos adicionais que são mesclados tanto no update quanto no create
 *   (ex.: overallTier, externalizingScore, internalizingScore do SRSS).
 */
export interface UpsertAssessmentParams {
    tenantId: string;
    studentId: string;
    type: string;
    screeningWindow?: string;
    academicYear?: number;
    screeningTeacherId?: string;
    rawAnswers: Prisma.InputJsonValue;
    processedScores: Prisma.InputJsonValue;
    /** Se true, usa screeningWindow+academicYear na busca findFirst. Default: false */
    findByScreeningWindow?: boolean;
    /** Campos extras para incluir no update e create (ex.: overallTier, scores) */
    extraData?: Record<string, unknown>;
}

/**
 * Realiza upsert de um assessment: busca por critérios e atualiza se existir, cria se não.
 *
 * O padrão de busca varia conforme `findByScreeningWindow`:
 * - true  -> busca por tenantId + studentId + type + screeningWindow + academicYear
 * - false -> busca por tenantId + studentId + type
 *
 * Campos sempre atualizados/criados: rawAnswers, processedScores, appliedAt.
 * Campos adicionais podem ser passados em `extraData`.
 */
export async function upsertAssessment(params: UpsertAssessmentParams) {
    const {
        tenantId,
        studentId,
        type,
        screeningWindow = 'DIAGNOSTIC',
        academicYear = new Date().getFullYear(),
        screeningTeacherId,
        rawAnswers,
        processedScores,
        findByScreeningWindow = false,
        extraData = {},
    } = params;

    // Montar a cláusula where para findFirst
    const whereClause: Record<string, unknown> = {
        tenantId,
        studentId,
        type,
    };

    if (findByScreeningWindow) {
        whereClause.screeningWindow = screeningWindow;
        whereClause.academicYear = academicYear;
    }

    const existing = await prisma.assessment.findFirst({
        where: whereClause as Prisma.AssessmentWhereInput,
    });

    const now = new Date();

    const updateData = {
        rawAnswers,
        processedScores,
        appliedAt: now,
        ...extraData,
    };

    if (existing) {
        return await prisma.assessment.update({
            where: { id: existing.id },
            data: updateData,
        });
    }

    return await prisma.assessment.create({
        data: {
            tenantId,
            studentId,
            type,
            screeningWindow,
            academicYear,
            screeningTeacherId,
            rawAnswers,
            processedScores,
            appliedAt: now,
            ...extraData,
        } as Prisma.AssessmentUncheckedCreateInput,
    });
}
