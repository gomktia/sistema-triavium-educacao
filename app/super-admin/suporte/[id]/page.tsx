import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth';
import { getTicketById } from '@/app/actions/tickets';
import { TicketDetailClient } from './ticket-detail-client';

export const metadata = {
    title: 'Detalhe do Chamado | Triavium SaaS',
};

export default async function TicketDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    await requireSuperAdmin();

    const { id } = await props.params;
    const ticket = await getTicketById(id);

    if (!ticket) {
        redirect('/super-admin/suporte');
    }

    // Serialize dates for client component
    const serializedTicket = {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
        messages: ticket.messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
        })),
    };

    return <TicketDetailClient ticket={serializedTicket} />;
}
