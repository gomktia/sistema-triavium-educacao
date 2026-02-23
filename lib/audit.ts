import { prisma } from '@/lib/prisma';

export async function logAudit(params: {
    tenantId: string;
    userId: string;
    action: string;
    targetId?: string;
    details?: Record<string, unknown>;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                action: params.action,
                targetId: params.targetId,
                details: params.details as any,
            },
        });
    } catch (error) {
        // Audit logging should never break the main operation
        console.error('[AUDIT] Failed to log:', error);
    }
}
