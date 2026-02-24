'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function fetchNotifications(limit: number = 10) {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        return await prisma.notification.findMany({
            where: { tenantId: user.tenantId, userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    } catch (e: any) {
        console.error('Error fetching notifications:', e.message);
        return [];
    }
}

export async function getUnreadCount() {
    const user = await getCurrentUser();
    if (!user) return 0;

    try {
        return await prisma.notification.count({
            where: { tenantId: user.tenantId, userId: user.id, isRead: false },
        });
    } catch (e: any) {
        console.error('Error counting unread notifications:', e.message);
        return 0;
    }
}

export async function fetchAllNotifications(page: number = 1, pageSize: number = 20) {
    const user = await getCurrentUser();
    if (!user) return { notifications: [], total: 0 };

    try {
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { tenantId: user.tenantId, userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            }),
            prisma.notification.count({
                where: { tenantId: user.tenantId, userId: user.id },
            }),
        ]);

        return { notifications, total };
    } catch (e: any) {
        console.error('Error fetching all notifications:', e.message);
        return { notifications: [], total: 0 };
    }
}

export async function markNotificationAsRead(id: string) {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        await prisma.notification.updateMany({
            where: { id, tenantId: user.tenantId, userId: user.id },
            data: { isRead: true },
        });
    } catch (e: any) {
        console.error('Error marking notification as read:', e.message);
    }
}

export async function markAllNotificationsAsRead() {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        await prisma.notification.updateMany({
            where: { tenantId: user.tenantId, userId: user.id, isRead: false },
            data: { isRead: true },
        });

        revalidatePath('/notificacoes');
    } catch (e: any) {
        console.error('Error marking all notifications as read:', e.message);
    }
}
