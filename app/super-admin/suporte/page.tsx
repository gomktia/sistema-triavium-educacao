import { requireSuperAdmin } from '@/lib/auth';
import { getTickets, getTicketMetrics, getTenantsList } from '@/app/actions/tickets';
import { SuporteClient } from './suporte-client';

export const metadata = {
    title: 'Suporte e Chamados | Triavium SaaS',
};

export default async function SuportePage() {
    await requireSuperAdmin();

    const [ticketsData, metrics, tenants] = await Promise.all([
        getTickets(),
        getTicketMetrics(),
        getTenantsList(),
    ]);

    return (
        <SuporteClient
            initialTickets={ticketsData.tickets}
            initialTotal={ticketsData.total}
            metrics={metrics}
            tenants={tenants}
        />
    );
}
