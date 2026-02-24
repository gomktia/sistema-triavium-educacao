'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSuperAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { revalidatePath } from 'next/cache';
import { TicketStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TicketFilters {
    tenantId?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
}

// ---------------------------------------------------------------------------
// Email helper
// ---------------------------------------------------------------------------

function getTicketNotificationHtml(
    userName: string,
    userEmail: string,
    tenantName: string,
    subject: string,
    message: string,
    priority: string
): string {
    const priorityColors: Record<string, string> = {
        LOW: '#64748b',
        MEDIUM: '#3b82f6',
        HIGH: '#f59e0b',
        URGENT: '#ef4444',
    };
    const priorityLabels: Record<string, string> = {
        LOW: 'Baixa',
        MEDIUM: 'Média',
        HIGH: 'Alta',
        URGENT: 'Urgente',
    };

    const color = priorityColors[priority] || '#3b82f6';
    const label = priorityLabels[priority] || priority;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://triavium.com.br';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:16px 16px 0 0;">
                <tr><td style="padding:32px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">Novo Chamado de Suporte</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;">
                        Prioridade: <span style="background:${color};color:#fff;padding:2px 10px;border-radius:12px;font-weight:700;">${label}</span>
                    </p>
                </td></tr>
            </table>
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="padding:40px;">
                    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <p style="color:#64748b;font-size:13px;margin:0 0 8px;"><strong>De:</strong> ${userName} (${userEmail})</p>
                        <p style="color:#64748b;font-size:13px;margin:0;"><strong>Escola:</strong> ${tenantName}</p>
                    </div>
                    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;font-weight:700;">${subject}</h2>
                    <div style="background:#f1f5f9;border-radius:12px;padding:24px;border-left:4px solid ${color};">
                        <p style="color:#475569;margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                        <tr><td align="center">
                            <a href="${appUrl}/super-admin/suporte" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:600;">
                                Ver no Painel
                            </a>
                        </td></tr>
                    </table>
                </td></tr>
                <tr><td style="padding:20px 40px;background-color:#f8fafc;border-radius:0 0 16px 16px;border-top:1px solid #e2e8f0;">
                    <p style="color:#94a3b8;margin:0;font-size:12px;text-align:center;">
                        &copy; ${new Date().getFullYear()} Triavium Educa\u00e7\u00e3o e Desenvolvimento LTDA
                    </p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// getTickets — paginated, filterable
// ---------------------------------------------------------------------------

export async function getTickets(filters?: TicketFilters) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && user.role !== 'MANAGER') {
        throw new Error('Acesso negado');
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;

    const where: Record<string, unknown> = {};

    // Managers can only see their own tenant's tickets
    if (!isAdmin) {
        where.tenantId = user.tenantId;
    } else if (filters?.tenantId) {
        where.tenantId = filters.tenantId;
    }

    if (filters?.status) {
        where.status = filters.status;
    }

    if (filters?.priority) {
        where.priority = filters.priority;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            include: {
                tenant: { select: { name: true } },
                user: { select: { name: true, email: true } },
                _count: { select: { messages: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total };
}

// ---------------------------------------------------------------------------
// getTicketById — full ticket with messages
// ---------------------------------------------------------------------------

export async function getTicketById(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const isAdmin = user.role === 'ADMIN';

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            tenant: { select: { name: true } },
            user: { select: { name: true, email: true, role: true } },
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { name: true, role: true } },
                },
            },
        },
    });

    if (!ticket) return null;

    // Access control: admin sees all, manager sees own tenant only
    if (!isAdmin && ticket.tenantId !== user.tenantId) {
        throw new Error('Acesso negado');
    }

    return ticket;
}

// ---------------------------------------------------------------------------
// createTicket — creates ticket + first message, notifies admins
// ---------------------------------------------------------------------------

export async function createTicket(data: {
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('Acesso negado');
    }

    const priority = data.priority || 'MEDIUM';

    const ticket = await prisma.supportTicket.create({
        data: {
            tenantId: user.tenantId,
            userId: user.id,
            subject: data.subject,
            priority,
            status: 'OPEN',
            messages: {
                create: {
                    userId: user.id,
                    content: data.message,
                    isAdmin: user.role === 'ADMIN',
                },
            },
        },
        include: {
            tenant: { select: { name: true } },
        },
    });

    // Notify admins via email
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { email: true },
        });

        const adminEmails = admins.map((a) => a.email).filter(Boolean);

        if (adminEmails.length > 0) {
            await sendEmail({
                to: adminEmails,
                subject: `🎫 Novo chamado: ${data.subject}`,
                html: getTicketNotificationHtml(
                    user.name,
                    user.email,
                    ticket.tenant.name,
                    data.subject,
                    data.message,
                    priority
                ),
            });
        }
    } catch (err) {
        console.error('Failed to send ticket notification email:', err);
    }

    revalidatePath('/super-admin/suporte');
    revalidatePath('/suporte-escola');

    return ticket;
}

// ---------------------------------------------------------------------------
// replyToTicket — add message + auto-update status
// ---------------------------------------------------------------------------

export async function replyToTicket(ticketId: string, content: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const isAdmin = user.role === 'ADMIN';

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { tenantId: true, status: true },
    });

    if (!ticket) throw new Error('Chamado não encontrado');

    // Access control
    if (!isAdmin && ticket.tenantId !== user.tenantId) {
        throw new Error('Acesso negado');
    }

    // Determine new status based on who is replying
    let newStatus: TicketStatus | undefined;
    if (isAdmin && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
        newStatus = 'WAITING_USER';
    } else if (!isAdmin && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
        newStatus = 'IN_PROGRESS';
    }

    const [message] = await Promise.all([
        prisma.ticketMessage.create({
            data: {
                ticketId,
                userId: user.id,
                content,
                isAdmin,
            },
            include: {
                user: { select: { name: true, role: true } },
            },
        }),
        newStatus
            ? prisma.supportTicket.update({
                  where: { id: ticketId },
                  data: { status: newStatus },
              })
            : Promise.resolve(),
    ]);

    revalidatePath('/super-admin/suporte');
    revalidatePath(`/super-admin/suporte/${ticketId}`);
    revalidatePath('/suporte-escola');

    return message;
}

// ---------------------------------------------------------------------------
// updateTicketStatus — admin only
// ---------------------------------------------------------------------------

export async function updateTicketStatus(
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED'
) {
    await requireSuperAdmin();

    const closedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date() : undefined;

    await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
            status,
            ...(closedAt ? { closedAt } : {}),
        },
    });

    revalidatePath('/super-admin/suporte');
    revalidatePath(`/super-admin/suporte/${ticketId}`);
    revalidatePath('/suporte-escola');

    return { success: true };
}

// ---------------------------------------------------------------------------
// getTicketMetrics — admin only
// ---------------------------------------------------------------------------

export async function getTicketMetrics() {
    await requireSuperAdmin();

    const [open, inProgress, resolved, total] = await Promise.all([
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        prisma.supportTicket.count(),
    ]);

    return { open, inProgress, resolved, total };
}

// ---------------------------------------------------------------------------
// getTenantsList — admin helper for filter dropdown
// ---------------------------------------------------------------------------

export async function getTenantsList() {
    await requireSuperAdmin();

    return prisma.tenant.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
}
