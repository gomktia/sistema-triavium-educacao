'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    HeartHandshake,
    Loader2,
    MessageSquare,
    Clock,
    CheckCircle2,
    BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTickets } from '@/app/actions/tickets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';

interface Ticket {
    id: string;
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: Date;
    tenant: { name: string };
    user: { name: string; email: string };
    _count: { messages: number };
}

interface SuporteClientProps {
    initialTickets: Ticket[];
    initialTotal: number;
    metrics: { open: number; inProgress: number; resolved: number; total: number };
    tenants: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; classes: string }> = {
    LOW: { label: 'Baixa', classes: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Média', classes: 'bg-blue-100 text-blue-700' },
    HIGH: { label: 'Alta', classes: 'bg-amber-100 text-amber-700' },
    URGENT: { label: 'Urgente', classes: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
    OPEN: { label: 'Aberto', classes: 'bg-amber-100 text-amber-700' },
    IN_PROGRESS: { label: 'Em Andamento', classes: 'bg-blue-100 text-blue-700' },
    WAITING_USER: { label: 'Aguardando', classes: 'bg-violet-100 text-violet-700' },
    RESOLVED: { label: 'Resolvido', classes: 'bg-emerald-100 text-emerald-700' },
    CLOSED: { label: 'Fechado', classes: 'bg-slate-100 text-slate-500' },
};

const ALL_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'];
const ALL_PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SuporteClient({ initialTickets, initialTotal, metrics, tenants }: SuporteClientProps) {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [, setTotal] = useState(initialTotal);
    const [isPending, startTransition] = useTransition();

    const [filterTenant, setFilterTenant] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    function applyFilters(tenant: string, status: string, priority: string) {
        startTransition(async () => {
            const filters: Record<string, string> = {};
            if (tenant !== 'all') filters.tenantId = tenant;
            if (status !== 'all') filters.status = status;
            if (priority !== 'all') filters.priority = priority;

            const result = await getTickets(filters);
            setTickets(result.tickets as Ticket[]);
            setTotal(result.total);
        });
    }

    function handleTenantChange(value: string) {
        setFilterTenant(value);
        applyFilters(value, filterStatus, filterPriority);
    }

    function handleStatusChange(value: string) {
        setFilterStatus(value);
        applyFilters(filterTenant, value, filterPriority);
    }

    function handlePriorityChange(value: string) {
        setFilterPriority(value);
        applyFilters(filterTenant, filterStatus, value);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <HeartHandshake size={14} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                        Atendimento
                    </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Suporte e Chamados
                </h1>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Abertos"
                    value={metrics.open}
                    icon={<MessageSquare size={16} />}
                    colorClasses="bg-amber-50 text-amber-600 border-amber-200"
                />
                <MetricCard
                    label="Em Andamento"
                    value={metrics.inProgress}
                    icon={<Clock size={16} />}
                    colorClasses="bg-blue-50 text-blue-600 border-blue-200"
                />
                <MetricCard
                    label="Resolvidos"
                    value={metrics.resolved}
                    icon={<CheckCircle2 size={16} />}
                    colorClasses="bg-emerald-50 text-emerald-600 border-emerald-200"
                />
                <MetricCard
                    label="Total"
                    value={metrics.total}
                    icon={<BarChart3 size={16} />}
                    colorClasses="bg-slate-50 text-slate-600 border-slate-200"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={filterTenant} onValueChange={handleTenantChange}>
                    <SelectTrigger className="w-[200px] h-9 text-xs">
                        <SelectValue placeholder="Escola" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Escolas</SelectItem>
                        {tenants.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        {ALL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {STATUS_CONFIG[s].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                        <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {ALL_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                                {PRIORITY_CONFIG[p].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {isPending && <Loader2 size={16} className="animate-spin text-indigo-500" />}
            </div>

            {/* Tickets Table */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 py-6">
                    <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">
                        Chamados
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Assunto</th>
                                    <th className="px-6 py-4">Escola</th>
                                    <th className="px-6 py-4">Aberto por</th>
                                    <th className="px-6 py-4">Prioridade</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Msgs</th>
                                    <th className="px-6 py-4">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => router.push(`/super-admin/suporte/${ticket.id}`)}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-5">
                                            <span className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                                {ticket.subject}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-slate-600">
                                            {ticket.tenant.name}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{ticket.user.name}</p>
                                                <p className="text-[10px] text-slate-400">{ticket.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-black uppercase tracking-widest border-none shadow-none',
                                                    PRIORITY_CONFIG[ticket.priority].classes
                                                )}
                                            >
                                                {PRIORITY_CONFIG[ticket.priority].label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-black uppercase tracking-widest border-none shadow-none',
                                                    STATUS_CONFIG[ticket.status].classes
                                                )}
                                            >
                                                {STATUS_CONFIG[ticket.status].label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-slate-500">
                                                {ticket._count.messages}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-[11px] font-bold text-slate-500">
                                            {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {tickets.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200">
                                    <HeartHandshake size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">
                                    Nenhum chamado encontrado
                                </h3>
                                <p className="text-slate-400 max-w-md">
                                    Quando os gestores abrirem chamados de suporte, eles aparecerão aqui.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

interface MetricCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClasses: string;
}

function MetricCard({ label, value, icon, colorClasses }: MetricCardProps) {
    return (
        <Card className={cn('border shadow-sm p-4', colorClasses)}>
            <div className="flex items-center justify-between mb-2">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {label}
                </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">{value}</h3>
        </Card>
    );
}
