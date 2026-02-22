'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function submitFeedback(data: { subject: string; description: string }) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Voce precisa estar logado para enviar sugestoes');
    }

    const feedback = await prisma.productFeedback.create({
        data: {
            userId: user.id,
            tenantId: user.tenantId,
            subject: data.subject,
            description: data.description,
            status: 'PENDING',
        }
    });

    // Opcional: enviar email para equipe Triavium
    // await sendFeedbackEmail(feedback, user);

    return { success: true, id: feedback.id };
}

export async function getFeedbacks() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Acesso negado');
    }

    return await prisma.productFeedback.findMany({
        include: {
            user: {
                select: { name: true, email: true }
            },
            tenant: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateFeedbackStatus(id: string, status: 'PENDING' | 'REVIEWING' | 'PLANNED' | 'IMPLEMENTED' | 'REJECTED') {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Acesso negado');
    }

    await prisma.productFeedback.update({
        where: { id },
        data: { status }
    });

    revalidatePath('/super-admin/suporte');
    return { success: true };
}
